// models/Inquiry.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String
}, {
    timestamps: true
});

const InquirySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['academic', 'financial', 'technical', 'administrative', 'other']
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    attachments: [AttachmentSchema],
    responseCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Inquiry', InquirySchema);