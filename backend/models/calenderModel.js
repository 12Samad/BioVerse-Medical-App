const mongoose = require("mongoose");

const CalenderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  testTopic: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  color: {
    type: String,
    default: "#3B82F6",
  },
  completed: {
    type: Boolean,
    default: false,
  },
});
const Calender = mongoose.model("Calender", CalenderSchema);
module.exports = { Calender };
