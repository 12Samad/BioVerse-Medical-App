// routes/challenge.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Question = require('../models/questionModel');
const ChallengeSession = require('../models/challengeModel');
const streakManager = require('../utils/streakManager');

/**
 * @route POST /api/challenge/start
 * @desc Start a new challenge session with hard questions
 * @access Private
 */
router.post('/start', async (req, res) => {
    try {
        const userId = req.query.userId;
        const { specialties = [], topics = [], questionCount = 10 } = req.body;

        // Build query to find hard questions
        const query = {
            difficulty: 'hard',
            specialty: { $ne: 'Unknown' }
        };

        // Add specialty filter if provided
        if (specialties && specialties.length > 0) {
            query.specialty = { $in: specialties };
        }

        // Add topic filter if provided
        if (topics && topics.length > 0) {
            query.topic = { $in: topics };
        }

        // Find hard questions with the specified criteria
        const hardQuestions = await Question.aggregate([
            { $match: query },
            { $sample: { size: questionCount } }, // Randomly select questions
            {
                $project: {
                    _id: 1,
                    question: 1,
                    options: 1,
                    specialty: 1,
                    topic: 1,
                    system: 1,
                    difficulty: 1
                }
            }
        ]);

        if (hardQuestions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hard questions found matching your criteria'
            });
        }

        // Format questions for the challenge session
        const sessionQuestions = hardQuestions.map(q => ({
            questionId: q._id,
            userAnswer: null,
            isCorrect: null,
            timeSpent: null
        }));

        // Create a new challenge session
        const challengeSession = new ChallengeSession({
            userId: new mongoose.Types.ObjectId(userId),
            questions: sessionQuestions,
            status: 'in_progress',
            metadata: {
                specialties: specialties,
                topics: topics,
                difficultyLevel: 'hard',
                questionCount: sessionQuestions.length
            }
        });

        await challengeSession.save();

        // Prepare response with questions and session data
        const formattedQuestions = hardQuestions.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            specialty: q.specialty,
            topic: q.topic,
            system: q.system
        }));

        res.status(201).json({
            success: true,
            sessionId: challengeSession._id,
            questions: formattedQuestions,
            totalQuestions: formattedQuestions.length
        });

    } catch (error) {
        console.error('Error starting challenge session:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while starting challenge session',
            error: error.message
        });
    }
});

/**
 * @route POST /api/challenge/:sessionId/submit
 * @desc Submit an answer for a challenge question
 * @access Private
 */
router.post('/:sessionId/submit', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.query.userId;
        const { questionId, answer, timeSpent } = req.body;

        // Find the session
        const session = await ChallengeSession.findOne({
            _id: sessionId,
            userId: userId,
            status: 'in_progress'
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Challenge session not found or already completed'
            });
        }

        // Find the question in the database to check the answer
        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        // Find the question in the session
        const questionIndex = session.questions.findIndex(
            q => q.questionId.toString() === questionId
        );

        if (questionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Question not found in this session'
            });
        }

        // Update the question with user's answer
        const isCorrect = answer === question.answer;
        session.questions[questionIndex].userAnswer = answer;
        session.questions[questionIndex].isCorrect = isCorrect;
        session.questions[questionIndex].timeSpent = timeSpent;

        // Check if all questions are answered
        const allAnswered = session.questions.every(q => q.userAnswer);
        if (allAnswered) {
            session.status = 'completed';
        }

        await streakManager.updateStreak(userId)

        await session.save();

        res.json({
            success: true,
            isCorrect,
            correctAnswer: question.answer,
            explanation: question.explanation,
            sessionComplete: session.status === 'completed',
            metrics: session.metrics
        });

    } catch (error) {
        console.error('Error submitting challenge answer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting answer',
            error: error.message
        });
    }
});

/**
 * @route GET /api/challenge/:sessionId
 * @desc Get details of a specific challenge session
 * @access Private
 */
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.query.userId;

        // Find the session
        const session = await ChallengeSession.findOne({
            _id: sessionId,
            userId: userId
        }).lean();

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Challenge session not found'
            });
        }

        // Get all question details
        const questionIds = session.questions.map(q => q.questionId);
        const questions = await Question.find({
            _id: { $in: questionIds }
        }).lean();

        // Map questions with session data
        const questionMap = questions.reduce((map, q) => {
            map[q._id.toString()] = q;
            return map;
        }, {});

        const sessionData = {
            ...session,
            questions: session.questions.map(q => {
                const questionData = questionMap[q.questionId.toString()] || {};
                return {
                    ...q,
                    question: questionData.question,
                    options: questionData.options,
                    correctAnswer: questionData.answer,
                    explanation: questionData.explanation,
                    specialty: questionData.specialty,
                    topic: questionData.topic,
                    system: questionData.system
                };
            })
        };

        res.json({
            success: true,
            session: sessionData
        });

    } catch (error) {
        console.error('Error fetching challenge session:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching session',
            error: error.message
        });
    }
});

/**
 * @route GET /api/challenge/history
 * @desc Get user's challenge session history
 * @access Private
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.query.userId;
        const { limit = 10, page = 1 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Find sessions for this user
        const sessions = await ChallengeSession.find({
            userId: userId
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Count total sessions
        const totalSessions = await ChallengeSession.countDocuments({
            userId: userId
        });

        res.json({
            success: true,
            sessions,
            pagination: {
                totalSessions,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSessions / parseInt(limit)),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching challenge history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching history',
            error: error.message
        });
    }
});

module.exports = router;