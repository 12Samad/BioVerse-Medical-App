// routes/inquiries.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const Inquiry = require('../models/inquiriesModel');
const Response = require('../models/responseModel');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, and TXT files are allowed.'));
        }
    }
});

// Helper function to upload a buffer to Cloudinary using a stream
const uploadToCloudinary = (buffer, originalname) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'inquiries', // Folder on Cloudinary to store files
                use_filename: true,
                unique_filename: false,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// Get all inquiries (admin gets all, students get their own)
router.get('/', auth, async (req, res) => {
    try {
        let query = {};

        // If not admin, only show user's inquiries
        if (req.userRole !== 'admin') {
            query.user = req.userId;
        }

        // Apply filters
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }

        if (req.query.category && req.query.category !== 'all') {
            query.category = req.query.category;
        }

        // Search
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex }
            ];
        }

        const inquiries = await Inquiry.find(query)
            .populate('user', 'name email studentId avatar')
            .populate('assignedTo', 'name email avatar')
            .sort({ updatedAt: -1 });

        res.json(inquiries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get inquiry by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate('user', 'name email studentId avatar role')
            .populate('assignedTo', 'name email avatar');

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        // Check if user has permission to view this inquiry
        if (req.userRole !== 'admin' && inquiry.user._id.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to view this inquiry' });
        }

        // Get responses for this inquiry
        const responses = await Response.find({ inquiry: req.params.id })
            .populate('user', 'name email avatar role')
            .sort({ createdAt: 1 });

        res.json({
            ...inquiry.toObject(),
            responses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new inquiry
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Process attachments uploaded directly to Cloudinary
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = await Promise.all(req.files.map(async (file) => {
                const result = await uploadToCloudinary(file.buffer, file.originalname);
                return {
                    public_id: result.public_id,
                    url: result.secure_url,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                };
            }));
        }

        const inquiry = new Inquiry({
            title,
            description,
            category,
            user: req.userId,
            attachments,
            responseCount: 0
        });

        const savedInquiry = await inquiry.save();

        // Populate user data before returning
        const populatedInquiry = await Inquiry.findById(savedInquiry._id)
            .populate('user', 'name email studentId avatar');

        res.status(201).json(populatedInquiry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update inquiry status
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        // Only admin or the inquiry owner can update status
        if (req.userRole !== 'admin' && inquiry.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        inquiry.status = status;
        inquiry.updatedAt = Date.now();

        // If admin is marking as in-progress, assign to themselves
        if (req.userRole === 'admin' && status === 'in-progress' && !inquiry.assignedTo) {
            inquiry.assignedTo = req.userId;
        }

        await inquiry.save();

        res.json(inquiry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add response to inquiry
router.post('/:id/responses', auth, upload.array('attachments', 5), async (req, res) => {
    try {
        const { content, isInternal = false } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Response content is required' });
        }

        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        // Check permissions
        if (req.userRole !== 'admin' && inquiry.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Only admins can create internal notes
        if (isInternal && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to create internal notes' });
        }

        // Process attachments uploaded directly to Cloudinary
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = await Promise.all(req.files.map(async (file) => {
                const result = await uploadToCloudinary(file.buffer, file.originalname);
                return {
                    public_id: result.public_id,
                    url: result.secure_url,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                };
            }));
        }

        const response = new Response({
            inquiry: req.params.id,
            content,
            user: req.userId,
            isInternal: isInternal === 'true' || isInternal === true,
            attachments
        });

        const savedResponse = await response.save();

        // If admin is responding and inquiry is open, set to in-progress
        if (req.userRole === 'admin' && inquiry.status === 'open') {
            inquiry.status = 'in-progress';

            // Assign to admin if not already assigned
            if (!inquiry.assignedTo) {
                inquiry.assignedTo = req.userId;
            }

            await inquiry.save();
        }

        // Mark inquiry updated time
        await Inquiry.findByIdAndUpdate(req.params.id, { updatedAt: Date.now() });

        // Return populated response
        const populatedResponse = await Response.findById(savedResponse._id)
            .populate('user', 'name email avatar role');

        res.status(201).json(populatedResponse);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get dashboard stats (admin only)
router.get('/stats/dashboard', auth, isAdmin, async (req, res) => {
    try {
        const totalCount = await Inquiry.countDocuments();
        const openCount = await Inquiry.countDocuments({ status: 'open' });
        const inProgressCount = await Inquiry.countDocuments({ status: 'in-progress' });
        const resolvedCount = await Inquiry.countDocuments({ status: 'resolved' });

        // Calculate response rate
        const inquiriesWithResponses = await Inquiry.countDocuments({ responseCount: { $gt: 0 } });
        const responseRate = totalCount > 0 ? Math.round((inquiriesWithResponses / totalCount) * 100) : 0;

        res.json({
            total: totalCount,
            open: openCount,
            inProgress: inProgressCount,
            resolved: resolvedCount,
            responseRate
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;