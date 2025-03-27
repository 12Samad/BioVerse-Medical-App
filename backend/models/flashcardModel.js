const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  hint: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  subsection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subsection'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastReviewed: {
    type: Date
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  mastery: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
flashcardSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


const Flashcard = mongoose.model('Flashcard', flashcardSchema);

module.exports = Flashcard;
