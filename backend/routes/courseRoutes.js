const express = require("express")
const router = express.Router()
const Course = require("../models/Course")
const authMiddleware = require("../middlewares/authMiddleware")
const auth = require("../middlewares/auth")
const path = require("path")
const fs = require("fs")
const cloudinary = require("cloudinary").v2
const multer = require("multer")
const streamifier = require("streamifier")

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure multer to use memory storage
const storage = multer.memoryStorage()
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/
        const extname = allowedTypes.test(file.originalname.toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)
        if (extname && mimetype) {
            return cb(null, true)
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, and TXT files are allowed."))
        }
    },
})

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get("/", async (req, res) => {
    console.log("\n🚀 [GET /api/courses] Request received with query:", req.query, "\n")

    try {
        // Copy req.query
        const reqQuery = { ...req.query }
        console.log("📝 [GET /api/courses] Copied request query:", reqQuery)

        // Fields to exclude
        const removeFields = ["select", "sort", "page", "limit", "search"]
        removeFields.forEach((param) => delete reqQuery[param])
        console.log("✂️ [GET /api/courses] Removed fields from query:", removeFields)

        // Create query string
        let queryStr = JSON.stringify(reqQuery)
        console.log("🔧 [GET /api/courses] Initial query string:", queryStr)

        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)
        console.log("🔄 [GET /api/courses] Query string with operators:", queryStr)

        // Finding resource
        let query = Course.find(JSON.parse(queryStr))
        console.log("🔍 [GET /api/courses] Finding courses with filter:", JSON.parse(queryStr))

        // Search functionality
        if (req.query.search) {
            console.log("🔎 [GET /api/courses] Adding search condition:", req.query.search)
            query = query.find({
                $text: { $search: req.query.search },
            })
        }

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(",").join(" ")
            console.log("🎯 [GET /api/courses] Selecting fields:", fields)
            query = query.select(fields)
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ")
            console.log("📊 [GET /api/courses] Sorting by:", sortBy)
            query = query.sort(sortBy)
        } else {
            console.log("📊 [GET /api/courses] Default sorting by -createdAt")
            query = query.sort("-createdAt")
        }

        // Pagination
        const page = Number.parseInt(req.query.page, 10) || 1
        const limit = Number.parseInt(req.query.limit, 10) || 10
        const startIndex = (page - 1) * limit
        const endIndex = page * limit
        const total = await Course.countDocuments(JSON.parse(queryStr))
        console.log(
            `📄 [GET /api/courses] Pagination setup: page=${page}, limit=${limit}, startIndex=${startIndex}, endIndex=${endIndex}, totalCourses=${total}`,
        )

        query = query.skip(startIndex).limit(limit)

        // Executing query
        const courses = await query
        console.log("✅ [GET /api/courses] Retrieved courses count:", courses.length)

        // Pagination result
        const pagination = {}

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit,
            }
            console.log("➡️ [GET /api/courses] Next page exists:", pagination.next)
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            }
            console.log("⬅️ [GET /api/courses] Previous page exists:", pagination.prev)
        }

        console.log("\n📤 [GET /api/courses] Sending response with courses data.\n")
        res.status(200).json({
            success: true,
            count: courses.length,
            pagination,
            data: courses,
        })
    } catch (err) {
        console.error("❌ [GET /api/courses] Error:", err)
        res.status(500).json({ success: false, error: "Server error" })
    }
})

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get("/:id", async (req, res) => {
    console.log(`\n🔍 [GET /api/courses/${req.params.id}] Request received for course ID: ${req.params.id}\n`)
    try {
        const course = await Course.findById(req.params.id)
        if (!course) {
            console.warn(`⚠️ [GET /api/courses/${req.params.id}] Course not found.`)
            return res.status(404).json({ success: false, error: `Course not found with id of ${req.params.id}` })
        }
        console.log("✅ [GET /api/courses/:id] Course found:", course)
        res.status(200).json({
            success: true,
            data: course,
        })
    } catch (err) {
        console.error("❌ [GET /api/courses/:id] Error:", err)
        res.status(500).json({ success: false, error: "Server error" })
    }
})

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin)
router.post("/", authMiddleware, upload.single("thumbnail"), async (req, res) => {
    console.log("\n✍️ [POST /api/courses] Request received")
    try {
        // Add createdBy to req.body
        req.body.createdBy = req.user.userId
        console.log("👤 [POST /api/courses] Added createdBy:", req.user.userId)

        // Check if a thumbnail file was uploaded via multer
        if (req.file) {
            console.log("📁 [POST /api/courses] Thumbnail file upload detected via multer:", req.file.originalname)

            // Upload the file to Cloudinary using streamifier
            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "medical-app/courses", public_id: `course_${Date.now()}` },
                        (error, result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(error)
                            }
                        },
                    )
                    streamifier.createReadStream(fileBuffer).pipe(stream)
                })
            }

            let result
            try {
                result = await streamUpload(req.file.buffer)
            } catch (uploadErr) {
                console.error("❌ [POST /api/courses] Error during Cloudinary upload:", uploadErr)
                return res.status(500).json({ success: false, error: "Cloudinary upload failed" })
            }

            console.log("📂 [POST /api/courses] File uploaded to Cloudinary. URL:", result.secure_url)
            // Set the thumbnail URL from Cloudinary
            req.body.thumbnail = result.secure_url
        }
        // Check if a thumbnail file was uploaded via express-fileupload
        else if (req.files && req.files.thumbnail) {
            const file = req.files.thumbnail
            console.log("📁 [POST /api/courses] Thumbnail file upload detected via express-fileupload:", file.name)

            // Validate file type
            if (!file.mimetype.startsWith("image")) {
                console.warn("🚫 [POST /api/courses] Uploaded file is not an image.")
                return res.status(400).json({ success: false, error: "Please upload an image file" })
            }

            // Validate file size
            if (file.size > process.env.MAX_FILE_UPLOAD) {
                console.warn("🚫 [POST /api/courses] File size exceeds limit.")
                return res
                    .status(400)
                    .json({ success: false, error: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}` })
            }

            // Upload the file to Cloudinary using streamifier
            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "medical-app/courses", public_id: `course_${Date.now()}` },
                        (error, result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(error)
                            }
                        },
                    )
                    streamifier.createReadStream(fileBuffer).pipe(stream)
                })
            }

            let result
            try {
                result = await streamUpload(file.data)
            } catch (uploadErr) {
                console.error("❌ [POST /api/courses] Error during Cloudinary upload:", uploadErr)
                return res.status(500).json({ success: false, error: "Cloudinary upload failed" })
            }

            console.log("📂 [POST /api/courses] File uploaded to Cloudinary. URL:", result.secure_url)
            // Set the thumbnail URL from Cloudinary
            req.body.thumbnail = result.secure_url
        }

        const modifiedData = { ...req.body, createdBy: req.user.userId }
        // Create course with thumbnail URL if it exists
        const course = await Course.create(modifiedData)
        console.log("✅ [POST /api/courses] Course created:", course)
        return res.status(201).json({
            success: true,
            data: course,
        })
    } catch (err) {
        console.error("❌ [POST /api/courses] Error:", err)
        res.status(500).json({ success: false, error: "Server error", message: err.message })
    }
})

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin)
router.put("/:id", upload.single("thumbnail"), async (req, res) => {
    console.log(`\n🔄 [PUT /api/courses/${req.params.id}] Request received for updating course ID: ${req.params.id}\n`)
    try {
        let course = await Course.findById(req.params.id)
        if (!course) {
            console.warn(`⚠️ [PUT /api/courses/${req.params.id}] Course not found.`)
            return res.status(404).json({ success: false, error: `Course not found with id of ${req.params.id}` })
        }

        // Handle file upload via multer
        if (req.file) {
            console.log("📁 [PUT /api/courses] Thumbnail file upload detected via multer:", req.file.originalname)

            // Upload the file to Cloudinary using streamifier
            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "medical-app/courses", public_id: `course_${Date.now()}` },
                        (error, result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(error)
                            }
                        },
                    )
                    streamifier.createReadStream(fileBuffer).pipe(stream)
                })
            }

            let result
            try {
                result = await streamUpload(req.file.buffer)
            } catch (uploadErr) {
                console.error("❌ [PUT /api/courses] Error during Cloudinary upload:", uploadErr)
                return res.status(500).json({ success: false, error: "Cloudinary upload failed" })
            }

            console.log("📂 [PUT /api/courses] File uploaded to Cloudinary. URL:", result.secure_url)

            // Delete old thumbnail from Cloudinary if it exists
            if (course.thumbnail && course.thumbnail.includes("cloudinary.com")) {
                try {
                    // Extract the public ID from the Cloudinary URL
                    const urlParts = course.thumbnail.split("/")
                    const uploadIndex = urlParts.findIndex((part) => part === "upload")
                    if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
                        const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/")
                        const lastDotIndex = publicIdWithExtension.lastIndexOf(".")
                        const publicId =
                            lastDotIndex !== -1 ? publicIdWithExtension.substring(0, lastDotIndex) : publicIdWithExtension

                        await cloudinary.uploader.destroy(publicId)
                        console.log("🗑️ [PUT /api/courses] Deleted old Cloudinary thumbnail:", publicId)
                    }
                } catch (deleteErr) {
                    console.warn("⚠️ [PUT /api/courses] Could not delete old thumbnail:", deleteErr)
                    // Continue with the update even if the old image deletion fails
                }
            }

            // Set the new thumbnail URL from Cloudinary
            req.body.thumbnail = result.secure_url
        }
        // Handle file upload via express-fileupload
        else if (req.files && req.files.thumbnail) {
            const file = req.files.thumbnail
            console.log("📁 [PUT /api/courses] Thumbnail file upload detected via express-fileupload:", file.name)

            // Validate file type
            if (!file.mimetype.startsWith("image")) {
                console.warn("🚫 [PUT /api/courses] Uploaded file is not an image.")
                return res.status(400).json({ success: false, error: "Please upload an image file" })
            }

            // Validate file size
            if (file.size > process.env.MAX_FILE_UPLOAD) {
                console.warn("🚫 [PUT /api/courses] File size exceeds limit.")
                return res
                    .status(400)
                    .json({ success: false, error: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}` })
            }

            // Upload to Cloudinary
            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "medical-app/courses", public_id: `course_${Date.now()}` },
                        (error, result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(error)
                            }
                        },
                    )
                    streamifier.createReadStream(fileBuffer).pipe(stream)
                })
            }

            let result
            try {
                result = await streamUpload(file.data)
            } catch (uploadErr) {
                console.error("❌ [PUT /api/courses] Error during Cloudinary upload:", uploadErr)
                return res.status(500).json({ success: false, error: "Cloudinary upload failed" })
            }

            console.log("📂 [PUT /api/courses] File uploaded to Cloudinary. URL:", result.secure_url)

            // Delete old thumbnail from Cloudinary if it exists
            if (course.thumbnail && course.thumbnail.includes("cloudinary.com")) {
                try {
                    // Extract the public ID from the Cloudinary URL
                    const urlParts = course.thumbnail.split("/")
                    const uploadIndex = urlParts.findIndex((part) => part === "upload")
                    if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
                        const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/")
                        const lastDotIndex = publicIdWithExtension.lastIndexOf(".")
                        const publicId =
                            lastDotIndex !== -1 ? publicIdWithExtension.substring(0, lastDotIndex) : publicIdWithExtension

                        await cloudinary.uploader.destroy(publicId)
                        console.log("🗑️ [PUT /api/courses] Deleted old Cloudinary thumbnail:", publicId)
                    }
                } catch (deleteErr) {
                    console.warn("⚠️ [PUT /api/courses] Could not delete old thumbnail:", deleteErr)
                    // Continue with the update even if the old image deletion fails
                }
            }

            // Set the new thumbnail URL from Cloudinary
            req.body.thumbnail = result.secure_url
        }

        // Handle arrays in the request body
        if (req.body.objectives && typeof req.body.objectives === "string") {
            try {
                req.body.objectives = JSON.parse(req.body.objectives)
            } catch (e) {
                console.warn("⚠️ [PUT /api/courses] Could not parse objectives:", e)
            }
        }

        if (req.body.prerequisites && typeof req.body.prerequisites === "string") {
            try {
                req.body.prerequisites = JSON.parse(req.body.prerequisites)
            } catch (e) {
                console.warn("⚠️ [PUT /api/courses] Could not parse prerequisites:", e)
            }
        }

        // Update course
        course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })

        console.log("✅ [PUT /api/courses] Course updated:", course)

        res.status(200).json({
            success: true,
            data: course,
        })
    } catch (err) {
        console.error("❌ [PUT /api/courses] Error:", err)
        res.status(500).json({ success: false, error: "Server error", message: err.message })
    }
})

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin)
router.delete("/:id", auth, async (req, res) => {
    console.log(`\n🗑️ [DELETE /api/courses/${req.params.id}] Request received for deleting course ID: ${req.params.id}\n`)
    try {
        const course = await Course.findById(req.params.id)
        if (!course) {
            console.warn(`⚠️ [DELETE /api/courses/${req.params.id}] Course not found.`)
            return res.status(404).json({
                success: false,
                error: `Course not found with id of ${req.params.id}`,
            })
        }

        // Delete thumbnail if it exists
        if (course.thumbnail) {
            // Check if the thumbnail is stored locally
            if (course.thumbnail.startsWith("/uploads")) {
                const filePath = `${process.env.FILE_UPLOAD_PATH}${course.thumbnail.replace("/uploads", "")}`
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                    console.log("🗑️ [DELETE /api/courses] Deleted local thumbnail file:", filePath)
                }
            }
            // Otherwise, check if the thumbnail is a Cloudinary URL
            else if (course.thumbnail.includes("cloudinary.com")) {
                // Extract the public ID from the Cloudinary URL.
                // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/courses/course_<timestamp>.jpg
                const urlParts = course.thumbnail.split("/")
                const uploadIndex = urlParts.findIndex((part) => part === "upload")
                if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
                    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/")
                    const lastDotIndex = publicIdWithExtension.lastIndexOf(".")
                    const publicId = publicIdWithExtension.substring(0, lastDotIndex)
                    await cloudinary.uploader.destroy(publicId)
                    console.log("🗑️ [DELETE /api/courses] Deleted Cloudinary thumbnail with publicId:", publicId)
                } else {
                    console.warn("⚠️ [DELETE /api/courses] Could not determine Cloudinary publicId for thumbnail deletion.")
                }
            }
        }

        // Delete the course document using deleteOne()
        await course.deleteOne()
        console.log("✅ [DELETE /api/courses] Course deleted successfully.")

        return res.status(200).json({
            success: true,
            data: {},
        })
    } catch (err) {
        console.error("❌ [DELETE /api/courses] Error:", err)
        return res.status(500).json({
            success: false,
            error: "Server error",
            message: err,
        })
    }
})

// @desc    Upload image for course
// @route   POST /api/courses/upload
// @access  Private (Admin)
router.post("/upload", auth, upload.single("thumbnail"), async (req, res) => {
    console.log("\n📤 [POST /api/courses/upload] Request received for Cloudinary image upload\n")

    try {
        // Check if a file is provided via multer
        if (req.file) {
            console.log("📁 [POST /api/courses/upload] File upload detected via multer:", req.file.originalname)

            // Upload the file to Cloudinary using streamifier
            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "medical-app/courses", public_id: `course_${Date.now()}` },
                        (error, result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(error)
                            }
                        },
                    )
                    streamifier.createReadStream(fileBuffer).pipe(stream)
                })
            }

            let result
            try {
                result = await streamUpload(req.file.buffer)
            } catch (uploadErr) {
                console.error("❌ [POST /api/courses/upload] Error during Cloudinary upload:", uploadErr)
                return res.status(500).json({ success: false, error: "Cloudinary upload failed" })
            }

            console.log("✅ [POST /api/courses/upload] File uploaded to Cloudinary. URL:", result.secure_url)
            return res.status(200).json({
                success: true,
                url: result.secure_url,
                public_id: result.public_id,
            })
        }
        // Check if a file is provided via express-fileupload
        else if (req.files && (req.files.thumbnail || req.files.image)) {
            const file = req.files.thumbnail || req.files.image
            console.log("📁 [POST /api/courses/upload] File upload detected via express-fileupload:", file.name)

            // Validate file type
            if (!file.mimetype.startsWith("image")) {
                console.warn("🚫 [POST /api/courses/upload] Uploaded file is not an image.")
                return res.status(400).json({ success: false, error: "Please upload an image file" })
            }

            // Validate file size
            if (file.size > process.env.MAX_FILE_UPLOAD) {
                console.warn("🚫 [POST /api/courses/upload] File size exceeds limit.")
                return res.status(400).json({
                    success: false,
                    error: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
                })
            }

            // Function to stream upload to Cloudinary
            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "medical-app/courses", public_id: `course_${Date.now()}` },
                        (error, result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(error)
                            }
                        },
                    )
                    streamifier.createReadStream(fileBuffer).pipe(stream)
                })
            }

            // Upload file data to Cloudinary
            const result = await streamUpload(file.data)
            console.log("✅ [POST /api/courses/upload] File uploaded to Cloudinary. URL:", result.secure_url)

            return res.status(200).json({
                success: true,
                url: result.secure_url,
                public_id: result.public_id,
            })
        } else {
            console.warn("🚫 [POST /api/courses/upload] No image file uploaded.")
            return res.status(400).json({ success: false, error: "No image file uploaded" })
        }
    } catch (err) {
        console.error("❌ [POST /api/courses/upload] Error:", err)
        return res.status(500).json({ success: false, error: "Server error", message: err.message })
    }
})

module.exports = router

