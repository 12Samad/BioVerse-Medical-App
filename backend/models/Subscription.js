const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  stripeCustomerId: {
    type: String,
    required: true,
  },
  subscriptionId: {
    type: String,
  },
  subscriptionStatus: {
    type: String,
    default: 'inactive'
  },
  planId: {
    type: String
  },
  planName: {
    type: String
  },
  planLimit: {
    type: Number,
    default: 0
  },
  generatedVideos: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
