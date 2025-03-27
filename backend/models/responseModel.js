// models/Response.js
const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
    inquiry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inquiry',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isInternal: {
        type: Boolean,
        default: false
    },
    attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        path: String
    }]
}, {
    timestamps: true
});

// Update inquiry responseCount when a response is added
ResponseSchema.post('save', async function () {
    try {
        if (!this.isInternal) {
            const Inquiry = mongoose.model('Inquiry');
            await Inquiry.findByIdAndUpdate(
                this.inquiry,
                { $inc: { responseCount: 1 } }
            );
        }
    } catch (err) {
        console.error('Error updating response count:', err);
    }
});

module.exports = mongoose.model('Response', ResponseSchema);