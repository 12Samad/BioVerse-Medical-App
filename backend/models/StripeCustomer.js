const mongoose = require('mongoose');

const stripeCustomerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('StripeCustomer', stripeCustomerSchema);
