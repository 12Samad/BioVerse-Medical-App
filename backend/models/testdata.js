const mongoose = require("mongoose")

const TestDataSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
        questionText: { type: String, required: true },
        userAnswer: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        timeSpent: { type: Number, required: true }, // In seconds
      },
    ],
    score: { type: Number, required: true },
    totalTime: { type: Number, required: true }, // Total time spent in the test
    percentage: { type: Number, required: true }, // Add this line for percentage
  },
  { timestamps: true },
)

const TestData = mongoose.model("TestData", TestDataSchema)

module.exports = TestData


// const mongoose = require("mongoose");

// const TestDataSchema = new mongoose.Schema({
//   userId: { type: String, ref: "User", required: true }, // Link to User
//   questions: [
//     {
//       questionText: { type: String, required: true },
//       userAnswer: { type: String, required: true },
//       correctAnswer: { type: String, required: true },
//       timeSpent: { type: Number, required: true }, // In seconds
//     }
//   ],
//   score: { type: Number, required: true },
//   totalTime: { type: Number, required: true } // Total time spent in the test
// }, { timestamps: true });

// const TestData = mongoose.model("TestData", TestDataSchema);

// module.exports = TestData;
