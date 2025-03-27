const mongoose = require('mongoose');
const TestData = require("../models/testdata");

// Save test results
exports.saveTestResults = async (req, res) => {
    try {
        console.log("Incoming request body:", req.body); // ✅ Debugging line 
        const { userId, questions } = req.body;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        // Validate required question fields
        for (const question of questions) {
            if (!question.questionText || !question.userAnswer || !question.correctAnswer || question.timeSpent === undefined) {
                return res.status(400).json({ error: 'Missing required fields in questions' });
            }
        }

        const newTestResult = new TestData(req.body);
        await newTestResult.save();

        res.status(201).json({ message: 'Test results saved successfully' });
    } catch (error) {
        console.error('Error saving test results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTestResults = async (req, res) => {
    try {
      const results = await TestData.find(); // Fetch all test results
      res.status(200).json(results);
    } catch (error) {
      console.error("Error fetching test results:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

