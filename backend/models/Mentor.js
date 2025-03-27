const mongoose = require('mongoose');

// Define the Mentor schema
const MentorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ],
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Please provide a company'],
        trim: true
    },
    bio: {
        type: String,
        required: [true, 'Please provide a bio']
    },
    avatar: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=Mentor&background=random'
    },
    expertise: {
        type: [String],
        required: [true, 'Please add at least one area of expertise']
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalSessions: {
        type: Number,
        default: 0
    },
    availability: [
        {
            date: {
                type: String,
                required: [true, 'Please provide a date']
            },
            slots: {
                type: [String],
                required: [true, 'Please provide at least one time slot']
            }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    mentorships: [{
        title: String,
        description: String
    }],
    reviews: [{
        userId: String,
        comment: String,
        rating: Number
    }]
});

// Add index for text search
MentorSchema.index({ name: 'text', bio: 'text', expertise: 'text' });

module.exports = mongoose.model('Mentor', MentorSchema);