// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isVerified: { type: Boolean, default: false },
  role: { type: String, default: "user" },
  // verificationToken: { type: String, default: null },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
