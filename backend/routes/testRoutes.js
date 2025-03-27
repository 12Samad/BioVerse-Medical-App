const express = require("express");
const router = express.Router();
const path = require("path");
require("dotenv").config(); // Load environment variables
const mongoose = require('mongoose');
const Stripe = require("stripe");
const { v4: uuidv4 } = require("uuid"); // ✅ Import at the top
// import Question from '../models/questionModel.js';
const OpenAI = require('openai');

const DailyChallenge = require("../models/DailyChallengeModel"); // issue hoskta h idr
const User = require("../models/User"); // issue hoskta h idr
const TestData = require("../models/testdata");
const Question = require('../models/questionModel'); // Use require instead of import
const Flashcard = require('../models/flashcardModel'); // Import the Flashcard model
const Leaderboard = require('..//models/leaderboard');
const Subject = require("../models/subjectModel")
const Subsection = require("../models/subSectionModel")
const { Calender } = require("../models/calenderModel");
const { Quest } = require("../models/questModel");
const TestResults = mongoose.model('TestResults', new mongoose.Schema({}), 'testdatas'); // Assuming your collection name is 'testdatas'

const StudyPlan = require("../models/studyPlan");
const openAiService = require("../services/OpenAI");
const streakManager = require("../utils/streakManager");

const questionsFilePath = path.join(__dirname, "../data/questions.json");
const Subscription = require("../models/Subscription"); // THIS IS MISSING!!!
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Load key from .env
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const Order = require("../models/orderModel"); // Assume you have an order model
const bodyParser = require("body-parser"); // missed


// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Ensure your .env has this key

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// AI Test Suggestions route
router.post('/ai-test-suggestions', async (req, res) => {
  try {
    console.log("Request received for AI test suggestions:", req.body);
    const { topic, questionCount, difficultyDistribution } = req.body;

    if (!topic || !questionCount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Determine difficulty distribution based on user selection
    let easyPercent = 33;
    let mediumPercent = 34;
    let hardPercent = 33;

    switch (difficultyDistribution) {
      case 'easy-focused':
        easyPercent = 50;
        mediumPercent = 30;
        hardPercent = 20;
        break;
      case 'challenge':
        easyPercent = 20;
        mediumPercent = 30;
        hardPercent = 50;
        break;
      case 'exam-prep':
        easyPercent = 25;
        mediumPercent = 50;
        hardPercent = 25;
        break;
      // balanced is the default
    }

    // Calculate the number of questions for each difficulty
    const easyCount = Math.round((questionCount * easyPercent) / 100);
    const mediumCount = Math.round((questionCount * mediumPercent) / 100);
    const hardCount = questionCount - easyCount - mediumCount;

    // Construct the prompt for the AI
    const prompt = `Generate a set of ${questionCount} medical questions on the topic of "${topic}" for a USMLE-style medical exam.

Distribution:
- ${easyCount} easy questions
- ${mediumCount} medium difficulty questions
- ${hardCount} challenging questions

For each question, provide:
1. A clinical scenario or concept question
2. 5 answer choices (A through E)
3. The correct answer (as the letter)
4. A brief explanation of why that answer is correct
5. The difficulty level (easy, medium, or hard)

Format each question as a JSON object with the following structure:
{
  "questionText": "The clinical scenario or concept question",
  "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option", "E. Fifth option"],
  "correctAnswer": "The letter of the correct answer (A-E)",
  "explanation": "Explanation of why the answer is correct",
  "difficulty": "easy|medium|hard",
  "topic": "${topic}"
}

Return an array of these JSON objects.`;
    console.log("Attempting OpenAI API call for topic:", topic);
    
    try {
      // Try to call the OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Adjust based on your preference and subscription
        messages: [
          {
            role: "system",
            content: "You are a medical exam question generator specialized in creating high-quality USMLE-style questions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the response
      const aiResponse = JSON.parse(completion.choices[0].message.content);
      
      // Return the generated questions
      return res.status(200).json({
        success: true,
        questions: aiResponse.questions || [],
        topic: topic
      });
    } catch (openaiError) {
      console.error("OpenAI API error, falling back to mock questions:", openaiError.message);
      
      // Generate mock questions as fallback
      const numQuestions = parseInt(questionCount);
      const mockQuestions = generateMockQuestions(topic, numQuestions, easyCount, mediumCount, hardCount);
      
      return res.status(200).json({
        success: true,
        questions: mockQuestions,
        topic: topic,
        isMock: true
      });
    }
    
  } catch (error) {
    console.error('Error generating AI test:', error);
    
    // Even in case of general errors, return mock questions
    const mockQuestions = generateMockQuestions(
      req.body.topic || "Medicine", 
      parseInt(req.body.questionCount) || 5
    );
    
    return res.status(200).json({
      success: true,
      questions: mockQuestions,
      topic: req.body.topic || "Medicine",
      isMock: true
    });
  }
});

// Helper function to generate mock questions
function generateMockQuestions(topic, totalCount, easyCount, mediumCount, hardCount) {
  // If difficulty counts are not provided, use default distribution
  if (!easyCount && !mediumCount && !hardCount) {
    easyCount = Math.round(totalCount * 0.33);
    mediumCount = Math.round(totalCount * 0.34);
    hardCount = totalCount - easyCount - mediumCount;
  }
  
  const questions = [];
  
  // Generate easy questions
  for (let i = 0; i < easyCount; i++) {
    questions.push(createMockQuestion(topic, "easy", i));
  }
  
  // Generate medium questions
  for (let i = 0; i < mediumCount; i++) {
    questions.push(createMockQuestion(topic, "medium", i + easyCount));
  }
  
  // Generate hard questions
  for (let i = 0; i < hardCount; i++) {
    questions.push(createMockQuestion(topic, "hard", i + easyCount + mediumCount));
  }
  
  return questions;
}

function createMockQuestion(topic, difficulty, index) {
  // Create different question templates based on difficulty
  let questionText, options, explanation;
  
  if (difficulty === "easy") {
    questionText = `A 35-year-old patient presents with symptoms related to ${topic}. Which of the following is the most appropriate initial step in management?`;
    options = [
      `A. Administer intravenous fluids`,
      `B. Order complete blood count`,
      `C. Start empiric antibiotics`,
      `D. Obtain a detailed history and physical examination`,
      `E. Refer to a specialist`
    ];
    explanation = `The correct answer is D. When evaluating a patient with symptoms related to ${topic}, the most appropriate initial step is always to obtain a detailed history and physical examination. This provides the foundation for all subsequent diagnostic and therapeutic decisions.`;
  } else if (difficulty === "medium") {
    questionText = `A 42-year-old patient with a history of ${topic} presents with new-onset symptoms. Laboratory findings show elevated inflammatory markers. Which of the following is the most likely diagnosis?`;
    options = [
      `A. Acute exacerbation of underlying condition`,
      `B. Drug-induced reaction`,
      `C. Autoimmune complication`,
      `D. Secondary infection`,
      `E. Paraneoplastic syndrome`
    ];
    explanation = `The correct answer is A. Given the patient's history of ${topic} and the elevated inflammatory markers, an acute exacerbation of their underlying condition is the most likely diagnosis. This pattern of presentation is characteristic in patients with chronic conditions related to ${topic}.`;
  } else { // hard
    questionText = `A 68-year-old patient with multiple comorbidities including ${topic} presents with complex symptoms. Recent imaging shows an unusual finding. Which of the following rare complications should be considered in the differential diagnosis?`;
    options = [
      `A. Atypical manifestation of common pathology`,
      `B. Rare genetic disorder with late presentation`,
      `C. Complex drug interaction effect`,
      `D. Unusual systemic manifestation of localized disease`,
      `E. Occult malignancy with paraneoplastic effect`
    ];
    explanation = `The correct answer is D. In complex cases involving ${topic}, unusual systemic manifestations of localized disease represent important diagnostic considerations that are often missed. The imaging findings support this diagnosis rather than the other options presented.`;
  }
  
  return {
    questionText,
    options,
    correctAnswer: "A", // For simplicity, making first option always correct
    explanation,
    difficulty,
    topic
  };
}
  // // AI Test Suggestions route
  // router.post('/ai-test-suggestions', async (req, res) => {
  //   try {
  //     console.log("Request received for AI test suggestions:", req.body);
  //     const { topic, questionCount, difficultyDistribution } = req.body;

  //     if (!topic || !questionCount) {
  //       return res.status(400).json({ error: 'Missing required parameters' });
  //     }

  //     // Determine difficulty distribution based on user selection
  //     let easyPercent = 33;
  //     let mediumPercent = 34;
  //     let hardPercent = 33;

  //     switch (difficultyDistribution) {
  //       case 'easy-focused':
  //         easyPercent = 50;
  //         mediumPercent = 30;
  //         hardPercent = 20;
  //         break;
  //       case 'challenge':
  //         easyPercent = 20;
  //         mediumPercent = 30;
  //         hardPercent = 50;
  //         break;
  //       case 'exam-prep':
  //         easyPercent = 25;
  //         mediumPercent = 50;
  //         hardPercent = 25;
  //         break;
  //       // balanced is the default
  //     }

  //     // Calculate the number of questions for each difficulty
  //     const easyCount = Math.round((questionCount * easyPercent) / 100);
  //     const mediumCount = Math.round((questionCount * mediumPercent) / 100);
  //     const hardCount = questionCount - easyCount - mediumCount;

  //     // Construct the prompt for the AI
  //     const prompt = `Generate a set of ${questionCount} medical questions on the topic of "${topic}" for a USMLE-style medical exam.

  // Distribution:
  // - ${easyCount} easy questions
  // - ${mediumCount} medium difficulty questions
  // - ${hardCount} challenging questions

  // For each question, provide:
  // 1. A clinical scenario or concept question
  // 2. 5 answer choices (A through E)
  // 3. The correct answer (as the letter)
  // 4. A brief explanation of why that answer is correct
  // 5. The difficulty level (easy, medium, or hard)

  // Format each question as a JSON object with the following structure:
  // {
  //   "questionText": "The clinical scenario or concept question",
  //   "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option", "E. Fifth option"],
  //   "correctAnswer": "The letter of the correct answer (A-E)",
  //   "explanation": "Explanation of why the answer is correct",
  //   "difficulty": "easy|medium|hard",
  //   "topic": "${topic}"
  // }

  // Return an array of these JSON objects.`;
  // console.log("Attempting OpenAI API call for topic:", topic);
  //     // Call the OpenAI API
  //     const completion = await openai.chat.completions.create({
  //       model: "gpt-3.5-turbo", // Adjust based on your preference and subscription
  //       messages: [
  //         {
  //           role: "system",
  //           content: "You are a medical exam question generator specialized in creating high-quality USMLE-style questions."
  //         },
  //         {
  //           role: "user",
  //           content: prompt
  //         }
  //       ],
  //       response_format: { type: "json_object" }
  //     });

  //     // Parse the response
  //     const aiResponse = JSON.parse(completion.choices[0].message.content);
      
  //     // Return the generated questions
  //     return res.status(200).json({
  //       success: true,
  //       questions: aiResponse.questions || [],
  //       topic: topic
  //     });
      
  //   } catch (error) {
  //     console.error('Error generating AI test:', error);
  //     return res.status(500).json({ error: 'Failed to generate test questions' });
  //   }
  // });

// Add this new route in your testRoutes.js file
router.post('/ai-report-feedback', async (req, res) => {
  try {
    const { questions, score, totalTime, percentage } = req.body;

    // Validate required fields
    if (!questions || !score) {
      return res.status(400).json({ error: 'Questions and score are required' });
    }

    // Create a structured summary of the test performance
    const correctQuestions = questions.filter(q => q.userAnswer === q.correctAnswer).length;
    const incorrectQuestions = questions.filter(q => q.userAnswer !== q.correctAnswer);

    // Identify patterns in incorrect answers (e.g., topics, question types)
    const incorrectTopics = incorrectQuestions.map(q => q.questionText).slice(0, 3);

    // Construct the prompt for the AI
    const prompt = `
As a medical education expert, please provide feedback on this medical test performance:

Test Performance Summary:
- Score: ${score}/${questions.length} (${percentage.toFixed(2)}%)
- Time taken: ${Math.floor(totalTime / 60)} minutes ${totalTime % 60} seconds

${incorrectQuestions.length > 0 ? `
Areas that need improvement:
${incorrectTopics.map((topic, i) => `${i + 1}. "${topic}"`).join('\n')}
` : 'All questions were answered correctly!'}

Please provide:
1. A brief assessment of the student's performance
2. Specific strengths demonstrated in the test
3. Areas for improvement with concrete study recommendations
4. A motivational note for continued learning
`;

    try {
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a medical education assistant who provides constructive feedback on test performance. Keep your feedback positive, focused on improvement, and under 300 words."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 750,
      });

      // Extract the feedback from OpenAI's response
      const feedback = response.choices[0]?.message?.content || "No feedback available";
      return res.json({ feedback });
    } catch (apiError) {
      console.error('OpenAI API error:', apiError.message);

      // Generate a fallback feedback if OpenAI API fails
      const fallbackFeedback = `
# Test Performance Assessment

Your score: ${score}/${questions.length} (${percentage.toFixed(2)}%)

## Strengths
You've demonstrated a good understanding of several medical concepts in this test.

## Areas for Improvement
${incorrectQuestions.length > 0 ?
          "Focus on reviewing the questions you missed, particularly those related to similar topics or concepts." :
          "While you did well, continued practice will help solidify your knowledge."}

## Next Steps
Continue to practice regularly and focus on understanding the underlying concepts rather than memorizing facts.

Keep up the good work!
      `;

      return res.json({
        feedback: fallbackFeedback,
        isFallback: true
      });
    }

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return res.status(500).json({ error: 'Failed to generate AI feedback' });
  }
});

router.post("/generatePlan", async (req, res) => {
  try {
    // Get form data from request body
    const formData = req.body;
    const { userId } = req.query

    // Validate required fields based on the schema
    const errors = {};

    // Personal details validation
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.currentLevel || !['beginner', 'intermediate', 'advanced', 'expert'].includes(formData.currentLevel)) {
      errors.currentLevel = 'Valid knowledge level is required';
    }

    // Exam details validation
    if (!formData.targetExam) {
      errors.targetExam = 'Target exam is required';
    }

    if (formData.examDate) {
      const examDate = new Date(formData.examDate);
      const today = new Date();
      if (examDate < today) {
        errors.examDate = 'Exam date cannot be in the past';
      }
    }

    // Subject preferences validation
    if (!formData.strongSubjects || !Array.isArray(formData.strongSubjects) || formData.strongSubjects.length === 0) {
      errors.strongSubjects = 'At least one strong subject is required';
    }

    if (!formData.weakSubjects || !Array.isArray(formData.weakSubjects) || formData.weakSubjects.length === 0) {
      errors.weakSubjects = 'At least one weak subject is required';
    }

    // Study preferences validation
    if (!formData.availableHours || formData.availableHours < 1) {
      errors.availableHours = 'Available hours must be at least 1';
    }

    if (!formData.daysPerWeek || formData.daysPerWeek < 1 || formData.daysPerWeek > 7) {
      errors.daysPerWeek = 'Days per week must be between 1 and 7';
    }

    if (!formData.preferredTimeOfDay || !['morning', 'afternoon', 'evening', 'night', 'mixed'].includes(formData.preferredTimeOfDay)) {
      errors.preferredTimeOfDay = 'Valid preferred time of day is required';
    }

    if (!formData.preferredLearningStyle || !['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'].includes(formData.preferredLearningStyle)) {
      errors.preferredLearningStyle = 'Valid learning style is required';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Normalize form data to match the schema
    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      currentLevel: formData.currentLevel,
      targetExam: formData.targetExam,
      examDate: formData.examDate ? new Date(formData.examDate) : undefined,
      strongSubjects: formData.strongSubjects || [],
      weakSubjects: formData.weakSubjects || [],
      availableHours: Number(formData.availableHours),
      daysPerWeek: Number(formData.daysPerWeek),
      preferredTimeOfDay: formData.preferredTimeOfDay,
      preferredLearningStyle: formData.preferredLearningStyle,
      targetScore: formData.targetScore || undefined,
      specificGoals: formData.specificGoals || undefined,
      additionalInfo: formData.additionalInfo || undefined,
      previousScores: formData.previousScores || undefined
    };

    console.log('Generating study plan for:', {
      name: userData.name,
      email: userData.email,
      targetExam: userData.targetExam,
      strongSubjects: userData.strongSubjects.length,
      weakSubjects: userData.weakSubjects.length
    });

    // Generate study plan with OpenAI
    const aiResponse = await openAiService.generateStudyPlan(userData);

    // Validate the AI response
    if (!aiResponse.plan || !aiResponse.plan.title || !aiResponse.plan.weeklyPlans) {
      throw new Error('Invalid response from AI service');
    }

    // Create a new StudyPlan document
    const studyPlan = new StudyPlan({
      userId: userId,
      userData: userData,
      plan: aiResponse.plan,
      metadata: aiResponse.metadata,
      isActive: true,
      lastAccessed: new Date()
    });

    // Save the plan to the database
    await studyPlan.save();

    console.log(`Saved study plan to database with ID: ${studyPlan._id}`);

    // Return the response with the database ID
    return res.status(200).json({
      success: true,
      data: {
        ...aiResponse,
        planId: studyPlan._id
      }
    });
  } catch (error) {
    console.error('Error generating study plan:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate study plan'
    });
  }
});

// Initialize OpenAI with your API key

//old route from thursday with no fall back response having quota issue:

// router.post('/ai-explain', async (req, res) => {
//   try {
//     const { question, options, correctAnswer, userAnswer } = req.body;

//     // Validate required fields
//     if (!question || !correctAnswer) {
//       return res.status(400).json({ error: 'Question and correct answer are required' });
//     }

//     // Construct the prompt for the AI
//     const prompt = `
// As a medical expert, please explain this medical question:

// Question: ${question}

// Options: ${options.join(', ')}

// Correct answer: ${correctAnswer}

// ${userAnswer !== correctAnswer ? `The user answered: ${userAnswer}, which is incorrect.` : 'The user answered correctly.'}

// Please provide a clear, concise explanation of:
// 1. Why the correct answer is right
// 2. The medical concept being tested
// 3. A simple way to remember this concept
// `;

//     // Call OpenAI API
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         { 
//           role: "system", 
//           content: "You are a medical education assistant who explains medical concepts clearly and concisely. Keep your explanations under 250 words and focused on helping medical students understand key concepts." 
//         },
//         { 
//           role: "user", 
//           content: prompt 
//         }
//       ],
//       temperature: 0.7,
//       max_tokens: 500,
//     });

//     // Extract the explanation from OpenAI's response
//     const explanation = response.choices[0]?.message?.content || "No explanation available";

//     res.json({ explanation });
//   } catch (error) {
//     console.error('Error generating AI explanation:', error);
//     res.status(500).json({ error: 'Failed to generate AI explanation' });
//   }
// });
router.post('/ai-explain', async (req, res) => {
  try {
    const { question, options, correctAnswer, userAnswer } = req.body;

    // Validate required fields
    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Question and correct answer are required' });
    }

    try {
      // Try to use OpenAI API first
      const prompt = `
      As a medical expert, please explain this medical question:
      
      Question: ${question}
      
      Options: ${options.join(', ')}
      
      Correct answer: ${correctAnswer}
      
      ${userAnswer !== correctAnswer ? `The user answered: ${userAnswer}, which is incorrect.` : 'The user answered correctly.'}
      
      Please provide a clear, concise explanation of:
      1. Why the correct answer is right
      2. The medical concept being tested
      3. A simple way to remember this concept
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a medical education assistant who explains medical concepts clearly and concisely. Keep your explanations under 250 words and focused on helping medical students understand key concepts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const explanation = response.choices[0]?.message?.content;
      return res.json({ explanation });

    } catch (apiError) {
      // If OpenAI API fails, use fallback explanation
      console.error('OpenAI API error:', apiError.message);

      // Generate a helpful fallback explanation
      const fallbackExplanation = `
The correct answer is: ${correctAnswer}

${correctAnswer} is the appropriate choice because it aligns with standard medical guidelines and practices. This question tests your understanding of core medical concepts and the ability to apply them in clinical scenarios.

To remember this concept: Create a mental connection between the key symptoms or conditions mentioned and the correct medical approach (${correctAnswer}). Focus on understanding the underlying principles rather than memorizing isolated facts.

Note: A more detailed explanation will be available soon as we enhance our explanation system.
      `;

      // Return fallback explanation - this ensures the feature works
      return res.json({
        explanation: fallbackExplanation,
        isFallback: true  // Optional flag to indicate this is a fallback
      });
    }

  } catch (error) {
    // This catches any other errors in the outer try block
    console.error('Unexpected error in route handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});


/// Import the TestResults model
//  All prices ID: I have got them from my stripe account:
const PLAN_PRICES = {
  basic: "price_1Qwr8vQ4u3lPIMsdj8pAL2mD",
  standard: "price_1QyV0HQ4u3lPIMsdMlZ09kor",
  premium: "price_1QyUytQ4hu3lPIMsdlxkcQPuf",
};
// Customer Portal Route
// router.post("/create-portal-session", async (req, res) => {
//   console.log("📩 Received Body:", req.body); // Log the request body
//   try {
//     const { user_id } = req.body;

//     if (!user_id) {
//       return res.status(400).json({ error: "Missing user_id." });
//     }

//     // Find customer in the database
//     const existingCustomer = await Order.findOne({ user_id });

//     if (!existingCustomer) {
//       return res.status(404).json({ error: "Customer not found." });
//     }

//     // Create a Stripe Billing Portal session
//     const session = await stripe.billing_portal.sessions.create({
//       customer: existingCustomer.stripe_customer_id,
//       return_url: "https://medical-frontend-phi.vercel.app/payment",
//     });

//     res.json({ url: session.url });
//   } catch (error) {
//     console.error("Error creating portal session:", error.message);
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

// router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
//   console.log("🔗 Webhook received!");
//   const sig = req.headers["stripe-signature"];

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.error("Webhook signature verification failed.", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   try {
//     switch (event.type) {
//       case "customer.subscription.created": {
//         const { id: subscriptionId, customer: customerId, current_period_start: startDate, current_period_end: endDate, items } = event.data.object;
//         const planId = items.data[0].price.product;
//         const product = await stripe.products.retrieve(planId);
//         const planName = product.name;

//         await Subscription.updateOne(
//           { stripeCustomerId: customerId },
//           { $set: { subscriptionStatus: "active", subscriptionId, planId, planName, startDate, endDate } },
//           { upsert: true }
//         );
//         break;
//       }
//       case "customer.subscription.deleted": {
//         const { id: subscriptionId } = event.data.object;
//         await Subscription.updateOne(
//           { subscriptionId },
//           { $set: { subscriptionStatus: "canceled" } }
//         );
//         break;
//       }
//       case "customer.subscription.paused": {
//         const { id: subscriptionId } = event.data.object;
//         await Subscription.updateOne(
//           { subscriptionId },
//           { $set: { subscriptionStatus: "paused" } }
//         );
//         break;
//       }
//       case "customer.subscription.resumed": {
//         const { id: subscriptionId } = event.data.object;
//         await Subscription.updateOne(
//           { subscriptionId },
//           { $set: { subscriptionStatus: "active" } }
//         );
//         break;
//       }
//       case "customer.subscription.updated": {
//         const { id: subscriptionId, items, current_period_start: startDate, current_period_end: endDate } = event.data.object;
//         const planId = items.data[0].price.product;
//         const product = await stripe.products.retrieve(planId);
//         const planName = product.name;

//         await Subscription.updateOne(
//           { subscriptionId },
//           { $set: { planId, planName, startDate, endDate } }
//         );
//         break;
//       }
//       case "invoice.payment_succeeded": {
//         const { customer: customerId, subscription: subscriptionId } = event.data.object;
//         await Subscription.updateOne(
//           { stripeCustomerId: customerId, subscriptionId },
//           { $set: { subscriptionStatus: "active" } }
//         );
//         break;
//       }
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }

//     res.status(200).json({ received: true });
//   } catch (err) {
//     console.error("Error processing webhook event:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });


// router.post("/checkout", async (req, res) => {
//   try {
//     const { userId, email, selectedPlan } = req.body; // Receive data from frontend

//     // Validate required fields
//     if (!selectedPlan || !email || !userId) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }
//     if (!PLAN_PRICES[selectedPlan]) {
//       return res.status(400).json({ error: "Invalid plan selected." });
//     }

//     // Check if customer exists in MongoDB
//     let existingUser = await User.findOne({ _id: userId });
//     if (!existingUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     let existingSubscription = await Subscription.findOne({ stripeCustomerId: existingUser.stripeCustomerId });

//     let customerId = existingUser.stripeCustomerId;

//     if (!customerId) {
//       // Create a new Stripe customer
//       const customer = await stripe.customers.create({ email });
//       customerId = customer.id;

//       // Update user with Stripe customer ID
//       existingUser.stripeCustomerId = customerId;
//       await existingUser.save();
//     }

//     // Prevent duplicate active subscriptions
//     if (existingSubscription && existingSubscription.subscriptionStatus === "active") {
//       return res.status(400).json({ error: "You already have an active subscription." });
//     }

//     // Create a new Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       customer: customerId,
//       payment_method_types: ["card"],
//       line_items: [{ price: PLAN_PRICES[selectedPlan], quantity: 1 }],
//       mode: "subscription",
//       success_url: "https://medical-frontend-phi.vercel.app/dashboard/success",
//       cancel_url: "https://medical-frontend-phi.vercel.app/dashboard/cancel",
//     });

//     // Ensure a valid subscription ID is stored
//     const subscriptionId = session.subscription || uuidv4(); // Use Stripe's ID or generate one

//     // Update or insert subscription in MongoDB
//     await Subscription.findOneAndUpdate(
//       { stripeCustomerId: customerId },
//       {
//         userId: userId,
//         subscriptionId: subscriptionId, // ✅ Ensure it's never null
//         subscriptionStatus: "pending",
//         planName: selectedPlan,
//       },
//       { upsert: true, new: true }
//     );

//     res.json({ url: session.url });
//   } catch (error) {
//     console.error("Stripe Checkout Error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });


// Get recommended questions for a user
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get last 3 test reports
    const tests = await TestData.find({ userId }).sort({ createdAt: -1 }).limit(3);

    if (!tests.length) {
      return res.status(404).json({ message: "No test data found" });
    }

    // Collect all unique questions from recent tests
    const seenQuestions = new Set();
    const recommendedQuestions = [];

    // Loop through tests and their questions
    for (const test of tests) {
      for (const question of test.questions) {
        const qId = question._id.toString();

        if (!seenQuestions.has(qId)) {
          recommendedQuestions.push({
            questionText: question.questionText,
            correctAnswer: question.correctAnswer,
            topic: "General Knowledge" // Add default topic or modify as needed
          });
          seenQuestions.add(qId);
        }
      }
    }

    // Return first 5 questions
    res.json({ recommendations: recommendedQuestions.slice(0, 5) });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Route to get streak data
// Add this to your testRoutes.js file
// Import the UserStreak model at the top of your file

// Update or add this route to handle the streak endpoint
router.get("/streak/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get streak and activity data using the streak manager
    const [streakData, activityData] = await Promise.all([
      streakManager.getStreakData(userId),
      streakManager.getActivityData(userId)
    ]);

    console.log("📊 Streak data:", {
      currentStreak: streakData.currentStreak,
      activityCount: activityData.length
    });

    res.json({
      streakData: activityData,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak
    });
  } catch (error) {
    console.error("Error fetching streak data:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/streak/force-update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await streakManager.updateStreak(userId, true);

    res.json({
      success: true,
      message: "Streak forcefully updated",
      data: result
    });
  } catch (error) {
    console.error("Error forcing streak update:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset a user's streak to a specific value
 */
router.post("/streak/reset/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { value = 1 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await streakManager.resetStreak(userId, value);

    res.json({
      success: true,
      message: `Streak reset to ${value}`,
      data: result
    });
  } catch (error) {
    console.error("Error resetting streak:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get detailed diagnostic information about a user's activity and streak
 */
router.get("/streak/diagnostic/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Get streak data
    const streakData = await streakManager.getStreakData(userId);

    // Get the current date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get date for yesterday
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    // Load models
    const collections = {
      TestData: mongoose.models.TestData,
      SimulationHistory: mongoose.models.SimulationHistory,
      ChallengeSession: mongoose.models.ChallengeSession,
      DailyChallenge: mongoose.models.DailyChallenge
    };

    // Check for activity today and yesterday
    const activityChecks = {};

    for (const [name, model] of Object.entries(collections)) {
      if (model) {
        // Check today's activity
        const todayActivity = await model.find({
          userId,
          createdAt: {
            $gte: today,
            $lt: new Date(today.getTime() + 86400000)
          }
        }).lean();

        // Check yesterday's activity
        const yesterdayActivity = await model.find({
          userId,
          createdAt: {
            $gte: yesterday,
            $lt: today
          }
        }).lean();

        activityChecks[name] = {
          today: {
            count: todayActivity.length,
            records: todayActivity.map(record => ({
              id: record._id,
              createdAt: record.createdAt
            }))
          },
          yesterday: {
            count: yesterdayActivity.length,
            records: yesterdayActivity.map(record => ({
              id: record._id,
              createdAt: record.createdAt
            }))
          }
        };
      }
    }

    res.json({
      streakData,
      dateInfo: {
        today: today.toISOString(),
        yesterday: yesterday.toISOString(),
        now: new Date().toISOString()
      },
      activityChecks
    });
  } catch (error) {
    console.error("Error in streak diagnostic:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch leaderboard data
// 📌 Route 1: Save Test Schedule for a User
router.post("/schedule-test", async (req, res) => {
  try {
    const { userId, subjectName, testTopic, date } = req.body;

    if (!userId || !subjectName || !testTopic || !date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newTest = new TestData({ userId, subjectName, testTopic, date });
    await newTest.save();

    res.status(201).json({ message: "Test scheduled successfully", test: newTest });
  } catch (error) {
    res.status(500).json({ error: "Error saving test schedule" });
  }
});

// 📌 Route 2: Get All Scheduled Tests for a User
router.get("/user-tests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tests = await TestData.find({ userId });

    if (!tests.length) return res.status(404).json({ message: "No tests found" });

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Error fetching test schedule" });
  }
});
// New route specifically for sorted test history
router.get("/user-tests-sorted/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching sorted tests for userId:", userId);
    
    // Same logic as the original route but with explicit sorting
    const tests = await TestData.find({ userId })
      .sort({ date: -1 }) // Sort by date in descending order (newest first)
      .limit(20); // Get a reasonable number of tests
    
    console.log(`Found ${tests.length} sorted tests`);
    
    if (!tests.length) return res.status(404).json({ message: "No tests found" });

    res.json(tests);
  } catch (error) {
    console.error("Error fetching sorted test data:", error);
    res.status(500).json({ error: "Error fetching test history" });
  }
});

// router.get('/leaderboard', async (req, res) => {
//   try {
//     // Fetch all leaderboard entries, sorted by score in descending order
//     const leaderboard = await Leaderboard.find().sort({ score: -1 });

//     res.status(200).json(leaderboard);
//   } catch (error) {
//     console.error("Error fetching leaderboard data:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });


// *
// Get leaderboard with time frame filter
// Get leaderboard data with time frame filtering
router.get("/leaderboard", async (req, res) => {
  try {
    const { timeFrame = "all-time" } = req.query

    // Build date filter based on timeFrame
    let dateFilter = {}
    const now = new Date()

    if (timeFrame === "weekly") {
      // Get the start of the current week (Sunday)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      dateFilter = { createdAt: { $gte: startOfWeek } }
    } else if (timeFrame === "monthly") {
      // Get the start of the current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      dateFilter = { createdAt: { $gte: startOfMonth } }
    }

    // Fetch leaderboard entries with time filter
    const leaderboard = await Leaderboard.find(dateFilter).sort({ score: -1, totalTime: 1 }).lean()

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    res.status(200).json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
      },
    })
  } catch (error) {
    console.error("Error fetching leaderboard data:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Get player stats and nearby players with time frame filtering
router.get("/leaderboard/player/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { timeFrame = "all-time" } = req.query

    // Build date filter based on timeFrame
    let dateFilter = {}
    const now = new Date()

    if (timeFrame === "weekly") {
      // Get the start of the current week (Sunday)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      dateFilter = { createdAt: { $gte: startOfWeek } }
    } else if (timeFrame === "monthly") {
      // Get the start of the current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      dateFilter = { createdAt: { $gte: startOfMonth } }
    }

    // Find the player's entry with time frame filter
    const id = new mongoose.Types.ObjectId(userId)
    const playerEntry = await Leaderboard.findOne({
      userId: id,
      ...dateFilter,
    }).lean()

    if (!playerEntry) {
      return res.status(404).json({
        success: false,
        error: "Player not found in this time frame",
      })
    }

    // Get all entries with time frame filter to calculate rank and nearby players
    const allEntries = await Leaderboard.find(dateFilter).sort({ score: -1, totalTime: 1 }).lean()

    // Find player's rank
    const playerIndex = allEntries.findIndex((entry) => entry.userId.toString() === userId)

    if (playerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Player not found in this time frame",
      })
    }

    const playerRank = playerIndex + 1

    // Get 2 players above and 2 players below
    const start = Math.max(0, playerIndex - 2)
    const end = Math.min(allEntries.length, playerIndex + 3)
    const nearbyPlayers = allEntries.slice(start, end).map((player, index) => ({
      ...player,
      rank: start + index + 1,
    }))

    res.status(200).json({
      success: true,
      data: {
        rank: playerRank,
        player: {
          ...playerEntry,
          rank: playerRank,
        },
        nearbyPlayers,
      },
    })
  } catch (error) {
    console.error("Error fetching player data:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// Add an endpoint to get real-time updates for top 3 changes
router.get("/leaderboard/top-three", async (req, res) => {
  try {
    const topThree = await Leaderboard.find()
      .sort({ score: -1, totalTime: 1 })
      .limit(3)
      .lean()
      .then((players) =>
        players.map((player, idx) => ({
          ...player,
          rank: idx + 1,
          isTopThree: true,
        })),
      )

    res.status(200).json({
      success: true,
      data: topThree,
    })
  } catch (error) {
    console.error("Error fetching top three data:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Modify your existing player stats endpoint to support time frames
router.get("/leaderboard/player/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { timeFrame = "all-time" } = req.query

    // Build date filter based on timeFrame
    let dateFilter = {}
    const now = new Date()

    if (timeFrame === "weekly") {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      dateFilter = { createdAt: { $gte: startOfWeek } }
    } else if (timeFrame === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      dateFilter = { createdAt: { $gte: startOfMonth } }
    }

    // Find the player's entry
    const id = new mongoose.Types.ObjectId(userId)
    const playerEntry = await Leaderboard.findOne({
      userId: id,
      ...dateFilter,
    }).lean()

    if (!playerEntry) {
      return res.status(404).json({
        success: false,
        error: "Player not found",
      })
    }

    // Get all entries to calculate rank and nearby players
    const allEntries = await Leaderboard.find(dateFilter).sort({ score: -1, totalTime: 1 }).lean()

    // Find player's rank
    const playerRank = allEntries.findIndex((entry) => entry.userId.toString() === userId.toString()) + 1

    // Get 2 players above and 2 players below
    const playerIndex = playerRank - 1
    const start = Math.max(0, playerIndex - 2)
    const end = Math.min(allEntries.length, playerIndex + 3)
    const nearbyPlayers = allEntries.slice(start, end).map((player, index) => ({
      ...player,
      rank: start + index + 1,
    }))

    res.status(200).json({
      success: true,
      data: {
        rank: playerRank,
        player: {
          ...playerEntry,
          rank: playerRank,
        },
        nearbyPlayers,
      },
    })
  } catch (error) {
    console.error("Error fetching player data:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})


/**
 * @route GET /api/statistics/specialty-ranking
 * @desc Get ranking of users grouped by specialty performance
 * @access Private
 */
router.get('/specialty-ranking', async (req, res) => {
  try {
    // Step 1: Get all users with their test data
    const usersWithTestData = await User.aggregate([
      // Lookup all tests for each user
      {
        $lookup: {
          from: "testdatas", // TestData collection name in MongoDB
          localField: "_id",
          foreignField: "userId",
          as: "tests"
        }
      },
      // Only include users who have taken tests
      {
        $match: {
          "tests": { $not: { $size: 0 } }
        }
      },
      // Project relevant user fields
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          tests: 1
        }
      }
    ]);

    // Step 2: Get all questions with their specialties
    const questions = await Question.find({}, {
      _id: 1,
      specialty: 1,
      topic: 1,
      system: 1
    });

    // Create a question lookup map
    const questionMap = {};
    questions.forEach(q => {
      if (q.specialty && q.specialty !== 'Unknown') {
        questionMap[q._id] = {
          specialty: q.specialty,
          topic: q.topic,
          system: q.system
        };
      }
    });

    // Step 3: Process each user's test data to get specialty performance
    const specialtyUsers = {};

    for (const user of usersWithTestData) {
      // Process all tests for this user
      let userSpecialtyData = {};

      for (const test of user.tests) {
        // Process each question in this test
        for (const question of test.questions) {
          const questionId = question.questionId;
          // Skip if the question doesn't exist or has unknown specialty
          if (!questionMap[questionId]) continue;

          const specialty = questionMap[questionId].specialty;
          const isCorrect = question.userAnswer === question.correctAnswer;

          // Initialize specialty data for this user if needed
          if (!userSpecialtyData[specialty]) {
            userSpecialtyData[specialty] = {
              total: 0,
              correct: 0,
              totalTime: 0,
              highestScore: 0,
              bestTestId: null,
              bestTestTime: null,
              bestTestDate: null
            };
          }

          // Update specialty stats
          userSpecialtyData[specialty].total++;
          if (isCorrect) userSpecialtyData[specialty].correct++;
          userSpecialtyData[specialty].totalTime += question.timeSpent;

          // Check if this test has a better score than previous ones for this specialty
          const specialtyQuestionsInTest = test.questions.filter(q => {
            const qId = q.questionId;
            return questionMap[qId] && questionMap[qId].specialty === specialty;
          });

          if (specialtyQuestionsInTest.length > 0) {
            const correctCount = specialtyQuestionsInTest.filter(q =>
              q.userAnswer === q.correctAnswer
            ).length;

            const percentageScore = (correctCount / specialtyQuestionsInTest.length) * 100;

            if (percentageScore > userSpecialtyData[specialty].highestScore) {
              userSpecialtyData[specialty].highestScore = percentageScore;
              userSpecialtyData[specialty].bestTestId = test._id;
              userSpecialtyData[specialty].bestTestTime = specialtyQuestionsInTest.reduce(
                (sum, q) => sum + q.timeSpent, 0
              );
              userSpecialtyData[specialty].bestTestDate = test.createdAt;
            }
          }
        }
      }

      // Add user to each specialty they've attempted
      Object.keys(userSpecialtyData).forEach(specialty => {
        // Skip "Unknown" specialty
        if (specialty === 'Unknown') return;

        if (!specialtyUsers[specialty]) {
          specialtyUsers[specialty] = [];
        }

        const stats = userSpecialtyData[specialty];
        specialtyUsers[specialty].push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          questionsAttempted: stats.total,
          correctAnswers: stats.correct,
          successRate: (stats.correct / stats.total) * 100,
          averageTimePerQuestion: stats.totalTime / stats.total,
          totalTimeSpent: stats.totalTime,
          highestScore: stats.highestScore,
          bestTestId: stats.bestTestId,
          bestTestTime: stats.bestTestTime,
          bestTestDate: stats.bestTestDate
        });
      });
    }

    // Step 4: Rank users within each specialty
    const rankingsBySpecialty = Object.keys(specialtyUsers).map(specialty => {
      // Sort users by success rate (highest first)
      const users = specialtyUsers[specialty].sort((a, b) => {
        // Sort by success rate first
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }
        // If success rates are equal, sort by average time (faster is better)
        return a.averageTimePerQuestion - b.averageTimePerQuestion;
      });

      // Add ranking position
      users.forEach((user, index) => {
        user.rank = index + 1;
      });

      return {
        specialty,
        userCount: users.length,
        users: users.map(user => ({
          rank: user.rank,
          userId: user.userId,
          userName: user.userName,
          successRate: parseFloat(user.successRate.toFixed(2)),
          questionsAttempted: user.questionsAttempted,
          correctAnswers: user.correctAnswers,
          averageTimePerQuestion: parseInt(user.averageTimePerQuestion),
          totalTimeSpent: user.totalTimeSpent,
          bestTest: {
            testId: user.bestTestId,
            score: parseFloat(user.highestScore.toFixed(2)),
            timeSpent: user.bestTestTime,
            date: user.bestTestDate
          }
        }))
      };
    });

    // Sort specialties by number of users (most popular first)
    rankingsBySpecialty.sort((a, b) => b.userCount - a.userCount);

    res.json({
      totalSpecialties: rankingsBySpecialty.length,
      lastUpdated: new Date(),
      rankings: rankingsBySpecialty
    });

  } catch (error) {
    console.error('Error generating specialty ranking:', error);
    res.status(500).json({ error: 'Server error while generating specialty rankings' });
  }
});

module.exports = router;

/**
 * @route   GET /api/analytics/comparative
 * @desc    Get comparative analytics based on user test performance
 * @access  Private
 */
router.get('/comparative/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all test data for this user
    const userTests = await TestData.find({ userId }).sort({ createdAt: -1 });

    if (userTests.length === 0) {
      return res.status(404).json({ message: 'No test data found for this user' });
    }

    // Get questions from the most recent test
    const mostRecentTest = userTests[0];
    const questionIds = mostRecentTest.questions.map(q => q.questionId);

    // Find all questions from the most recent test with proper population
    // Make sure to use the proper path for nested fields
    const questions = await Question.find({
      _id: { $in: questionIds }
    }).populate('subject').populate('subsection');

    // Check if questions were found and populated
    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for the most recent test' });
    }

    // For debugging
    console.log(`Found ${questions.length} questions`);
    console.log('Sample question subject:', questions[0]?.subject);
    console.log('Sample question subsection:', questions[0]?.subsection);

    // Group the questions by subject, subsection, and topic
    const subjectPerformance = {};
    const topicPerformance = {};
    const subsectionPerformance = {};

    // Calculate user performance on each question
    mostRecentTest.questions.forEach(userQuestion => {
      const question = questions.find(q => q._id.toString() === userQuestion.questionId.toString());

      if (!question) {
        console.log(`Question not found: ${userQuestion.questionId}`);
        return;
      }

      // Check if subject and subsection exist
      if (!question.subject || !question.subsection) {
        console.log(`Missing subject or subsection for question: ${question._id}`);
        return;
      }

      const subjectId = question.subject._id.toString();
      const subsectionId = question.subsection._id.toString();
      const topic = question.topic || 'Unknown Topic';

      // Initialize subject data if not exists
      if (!subjectPerformance[subjectId]) {
        subjectPerformance[subjectId] = {
          name: question.subject.name || 'Unknown Subject',
          correct: 0,
          total: 0,
          percentage: 0
        };
      }

      // Initialize subsection data if not exists
      if (!subsectionPerformance[subsectionId]) {
        subsectionPerformance[subsectionId] = {
          name: question.subsection.name || 'Unknown Subsection',
          subject: question.subject.name || 'Unknown Subject',
          correct: 0,
          total: 0,
          percentage: 0
        };
      }

      // Initialize topic data if not exists
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = {
          name: topic,
          correct: 0,
          total: 0,
          percentage: 0
        };
      }

      // Update counters
      const isCorrect = userQuestion.userAnswer === userQuestion.correctAnswer;

      // Update subject counters
      subjectPerformance[subjectId].total++;
      if (isCorrect) subjectPerformance[subjectId].correct++;

      // Update subsection counters
      subsectionPerformance[subsectionId].total++;
      if (isCorrect) subsectionPerformance[subsectionId].correct++;

      // Update topic counters
      topicPerformance[topic].total++;
      if (isCorrect) topicPerformance[topic].correct++;
    });

    // Calculate percentages
    Object.values(subjectPerformance).forEach(subject => {
      subject.percentage = subject.total > 0 ? Math.round((subject.correct / subject.total) * 100) : 0;
    });

    Object.values(subsectionPerformance).forEach(subsection => {
      subsection.percentage = subsection.total > 0 ? Math.round((subsection.correct / subsection.total) * 100) : 0;
    });

    Object.values(topicPerformance).forEach(topic => {
      topic.percentage = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
    });

    // Get average performance across all users for comparison
    const allUserTests = await TestData.find();
    const globalPerformance = {
      average: {
        score: 0,
        percentage: 0,
        totalTests: allUserTests.length
      }
    };

    if (allUserTests.length > 0) {
      // Filter out NaN or undefined percentages
      const validTests = allUserTests.filter(test =>
        !isNaN(test.percentage) && test.percentage !== undefined);

      const totalScore = validTests.reduce((sum, test) => sum + test.score, 0);
      const totalPercentage = validTests.reduce((sum, test) => sum + test.percentage, 0);

      const validTestCount = validTests.length || 1; // Avoid division by zero

      globalPerformance.average.score = Math.round(totalScore / validTestCount);
      globalPerformance.average.percentage = Math.round(totalPercentage / validTestCount);
    }

    // Calculate user's overall percentile rank
    // Filter out tests with valid percentages
    const validUserTests = userTests.filter(test =>
      !isNaN(test.percentage) && test.percentage !== undefined);

    let userAvgPerformance = 0;
    if (validUserTests.length > 0) {
      userAvgPerformance = validUserTests.reduce((sum, test) => sum + test.percentage, 0) / validUserTests.length;
    }

    // Filter out NaN percentages from all tests
    const validPercentages = allUserTests
      .map(test => test.percentage)
      .filter(percentage => !isNaN(percentage) && percentage !== undefined)
      .sort((a, b) => a - b);

    const percentileRank = validPercentages.length > 0
      ? Math.round((validPercentages.filter(percentage => percentage < userAvgPerformance).length / validPercentages.length) * 100)
      : 0;

    // Get user's time-based metrics
    const userAvgTimePerQuestion = userTests.length > 0
      ? userTests.reduce((sum, test) =>
        sum + (test.questions.length > 0 ? test.totalTime / test.questions.length : 0), 0) / userTests.length
      : 0;

    // Calculate improvement over time if multiple tests exist
    let improvement = null;
    if (userTests.length > 1) {
      const firstTest = userTests[userTests.length - 1]; // Oldest test
      const latestTest = userTests[0]; // Newest test

      improvement = {
        percentage: latestTest.percentage - firstTest.percentage,
        scoreChange: latestTest.score - firstTest.score,
        timeEfficiency: firstTest.totalTime - latestTest.totalTime
      };
    }

    const comparativeAnalytics = {
      userPerformance: {
        subjectPerformance: Object.values(subjectPerformance),
        subsectionPerformance: Object.values(subsectionPerformance),
        topicPerformance: Object.values(topicPerformance),
        overallPercentile: percentileRank,
        averageTimePerQuestion: Math.round(userAvgTimePerQuestion),
        totalTestsTaken: userTests.length
      },
      globalPerformance,
      improvement
    };

    console.log('Subjects found:', Object.keys(subjectPerformance).length);
    console.log('Subsections found:', Object.keys(subsectionPerformance).length);
    console.log('Topics found:', Object.keys(topicPerformance).length);

    return res.status(200).json(comparativeAnalytics);

  } catch (error) {
    console.error('Error fetching comparative analytics:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/topic-mastery
 * @desc    Get topic mastery metrics
 * @access  Private
 */
router.get('/topic-mastery/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // Get all test data for this user
    console.log(new mongoose.Types.ObjectId(userId))
    const userTests = await TestData.find({ userId: new mongoose.Types.ObjectId(userId) });

    if (userTests.length === 0) {
      return res.status(404).json({ message: 'No test data found for this user' });
    }

    // Extract all question IDs from all tests
    const allQuestionIds = [];
    userTests.forEach(test => {
      test.questions.forEach(question => {
        allQuestionIds.push(question.questionId);
      });
    });

    // Get unique question IDs
    const uniqueQuestionIds = [...new Set(allQuestionIds)];

    // Get the actual questions
    const questions = await Question.find({
      _id: { $in: uniqueQuestionIds }
    }).populate('subject subsection');

    // Create a map of question ID to question data
    const questionMap = {};
    questions.forEach(question => {
      questionMap[question._id.toString()] = question;
    });

    // Initialize topic mastery data
    const topicMastery = {};
    const systemMastery = {};
    const subtopicMastery = {};

    // Process all question attempts
    userTests.forEach(test => {
      test.questions.forEach(userQuestion => {
        const question = questionMap[userQuestion.questionId];

        if (!question) return;

        // Initialize topic data if not exists
        if (!topicMastery[question.topic]) {
          topicMastery[question.topic] = {
            name: question.topic,
            attempts: 0,
            correct: 0,
            incorrect: 0,
            averageTime: 0,
            totalTime: 0,
            masteryLevel: 'Not Started', // Not Started, Beginner, Intermediate, Advanced, Expert
            masteryScore: 0,
            lastAttemptDate: null
          };
        }

        // Initialize system data if not exists
        if (!systemMastery[question.system]) {
          systemMastery[question.system] = {
            name: question.system,
            attempts: 0,
            correct: 0,
            incorrect: 0,
            masteryLevel: 'Not Started',
            masteryScore: 0
          };
        }

        // Process subtopics
        question.subtopics.forEach(subtopic => {
          if (!subtopicMastery[subtopic]) {
            subtopicMastery[subtopic] = {
              name: subtopic,
              parentTopic: question.topic,
              attempts: 0,
              correct: 0,
              incorrect: 0,
              masteryLevel: 'Not Started',
              masteryScore: 0
            };
          }

          // Update subtopic counters
          subtopicMastery[subtopic].attempts++;

          if (userQuestion.userAnswer === userQuestion.correctAnswer) {
            subtopicMastery[subtopic].correct++;
          } else {
            subtopicMastery[subtopic].incorrect++;
          }
        });

        // Update topic counters
        const isCorrect = userQuestion.userAnswer === userQuestion.correctAnswer;

        topicMastery[question.topic].attempts++;
        topicMastery[question.topic].totalTime += userQuestion.timeSpent;
        topicMastery[question.topic].lastAttemptDate = test.createdAt;

        if (isCorrect) {
          topicMastery[question.topic].correct++;
        } else {
          topicMastery[question.topic].incorrect++;
        }

        // Update system counters
        systemMastery[question.system].attempts++;

        if (isCorrect) {
          systemMastery[question.system].correct++;
        } else {
          systemMastery[question.system].incorrect++;
        }
      });
    });

    // Calculate mastery metrics for topics
    Object.values(topicMastery).forEach(topic => {
      // Calculate average time
      topic.averageTime = topic.attempts > 0 ? Math.round(topic.totalTime / topic.attempts) : 0;

      // Calculate mastery score (weighted formula)
      const accuracyWeight = 0.7;
      const attemptsWeight = 0.3;

      const accuracy = topic.attempts > 0 ? (topic.correct / topic.attempts) : 0;
      const attemptScore = Math.min(1, topic.attempts / 10); // Normalize attempts (max at 10)

      topic.masteryScore = Math.round((accuracy * accuracyWeight + attemptScore * attemptsWeight) * 100);

      // Determine mastery level
      if (topic.attempts === 0) {
        topic.masteryLevel = 'Not Started';
      } else if (topic.masteryScore < 40) {
        topic.masteryLevel = 'Beginner';
      } else if (topic.masteryScore < 60) {
        topic.masteryLevel = 'Intermediate';
      } else if (topic.masteryScore < 85) {
        topic.masteryLevel = 'Advanced';
      } else {
        topic.masteryLevel = 'Expert';
      }
    });

    // Calculate mastery metrics for systems and subtopics
    [systemMastery, subtopicMastery].forEach(masteryObj => {
      Object.values(masteryObj).forEach(item => {
        const accuracy = item.attempts > 0 ? (item.correct / item.attempts) : 0;
        const attemptScore = Math.min(1, item.attempts / 10);

        item.masteryScore = Math.round((accuracy * 0.7 + attemptScore * 0.3) * 100);

        if (item.attempts === 0) {
          item.masteryLevel = 'Not Started';
        } else if (item.masteryScore < 40) {
          item.masteryLevel = 'Beginner';
        } else if (item.masteryScore < 60) {
          item.masteryLevel = 'Intermediate';
        } else if (item.masteryScore < 85) {
          item.masteryLevel = 'Advanced';
        } else {
          item.masteryLevel = 'Expert';
        }
      });
    });

    // Get related quests for prioritization
    const userQuests = await Quest.find({ userId, isCompleted: false });

    // Create a map of quest subjects
    const questSubjects = new Set();
    userQuests.forEach(quest => {
      questSubjects.add(quest.subject.toLowerCase());
    });

    // Check if topics are associated with any active quests
    Object.values(topicMastery).forEach(topic => {
      topic.isQuestPriority = questSubjects.has(topic.name.toLowerCase());
    });

    // Sort topics by mastery score (ascending) to highlight areas needing improvement
    const sortedTopics = Object.values(topicMastery).sort((a, b) => {
      // First sort by quest priority
      if (a.isQuestPriority && !b.isQuestPriority) return -1;
      if (!a.isQuestPriority && b.isQuestPriority) return 1;

      // Then sort by mastery score
      return a.masteryScore - b.masteryScore;
    });

    // Get recommendations for improvement
    const recommendations = sortedTopics.slice(0, 5).map(topic => ({
      topic: topic.name,
      masteryLevel: topic.masteryLevel,
      masteryScore: topic.masteryScore,
      isQuestPriority: topic.isQuestPriority,
      recommendation: topic.masteryScore < 40
        ? 'Focus on building fundamentals in this topic'
        : topic.masteryScore < 70
          ? 'Spend more time practicing this topic to strengthen understanding'
          : 'Maintain your knowledge with periodic revision'
    }));

    const topicMasteryMetrics = {
      topics: Object.values(topicMastery),
      systems: Object.values(systemMastery),
      subtopics: Object.values(subtopicMastery),
      weakestTopics: sortedTopics.slice(0, 5),
      strongestTopics: [...sortedTopics].sort((a, b) => b.masteryScore - a.masteryScore).slice(0, 5),
      recommendations,
      overallMastery: {
        averageScore: Math.round(
          Object.values(topicMastery).reduce((sum, topic) => sum + topic.masteryScore, 0) /
          Object.values(topicMastery).length
        ),
        topicsStarted: Object.values(topicMastery).filter(t => t.attempts > 0).length,
        topicsAtExpert: Object.values(topicMastery).filter(t => t.masteryLevel === 'Expert').length,
        topicsNeedingWork: Object.values(topicMastery).filter(t => t.masteryScore < 50 && t.attempts > 0).length
      }
    };
    return res.status(200).json(topicMasteryMetrics);

  } catch (error) {
    console.error('Error fetching topic mastery metrics:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// *

router.get('/performance', async (req, res) => {
  const { userId } = req.query; // Get the userId from the query parameters
  console.log("Received user id: ", userId);

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' }); // If userId is not provided, return an error
  }

  try {
    // Query the testdatas collection for the results for this specific user
    const results = await TestResults.find({ userId: new mongoose.Types.ObjectId(userId) });

    if (results.length === 0) {
      return res.status(404).json({ message: 'No test results found for this user.' });
    }

    // Return the test results data
    res.json(results);
  } catch (err) {
    console.error('Error fetching test results:', err);
    res.status(500).json({ message: 'Error fetching test results.' });
  }
});

// Route to get flashcards
// Get flashcards with optional filtering
router.get("/flashcards", async (req, res) => {
  const numFlashcards = parseInt(req.query.numFlashcards, 10);
  const category = req.query.category; // Get category from query params

  console.log("Requested Total Number of Flashcards:", numFlashcards);
  console.log("Requested Category:", category);

  if (isNaN(numFlashcards) || numFlashcards <= 0) {
    return res.status(400).json({ error: "Invalid number of flashcards." });
  }

  try {
    let query = {};
    if (category) {
      query.category = category; // Apply category filter if provided
    }

    // ✅ Explicitly select "question answer hint category" fields
    const flashcards = await Flashcard.find(query, "question answer hint category").limit(numFlashcards);
    console.log("Fetched Flashcards from DB:", flashcards); // ✅ Debugging step
    if (flashcards.length === 0) {
      return res.status(404).json({ error: "No flashcards found." });
    }

    res.json(flashcards);
  } catch (err) {
    console.error("❌ Error fetching flashcards:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST endpoint to create flashcards
router.post("/flashcards", async (req, res) => {
  try {
    console.log("Received Request Body:", req.body);

    // Ensure req.body is an array
    let flashcards = Array.isArray(req.body) ? req.body : [req.body];

    // Validate each flashcard
    for (const flashcard of flashcards) {
      if (
        !flashcard.question ||
        !flashcard.answer ||
        !flashcard.hint ||
        !flashcard.category
      ) {
        return res.status(400).json({ error: "Each flashcard must have question, answer, hint, and category" });
      }
    }

    // Create flashcards in the database
    const createdFlashcards = await Flashcard.insertMany(flashcards);

    res.status(201).json({
      message: "Flashcards created successfully",
      data: createdFlashcards,
      status: 201
    });
  } catch (error) {
    console.error("❌ Error creating flashcards:", error);
    res.status(500).json({ error: "Failed to create flashcards" });
  }
});

// PUT endpoint to update a flashcard
router.put("/flashcards/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { question, answer, hint, category } = req.body

    // Validate input
    if (!question || !answer || !hint || !category) {
      return res.status(400).json({
        error: "Missing required fields. Question, answer, hint, and category are required.",
      })
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid flashcard ID format" })
    }

    // Find and update the flashcard
    const updatedFlashcard = await Flashcard.findByIdAndUpdate(
      id,
      { question, answer, hint, category },
      { new: true, runValidators: true },
    )

    // Check if flashcard exists
    if (!updatedFlashcard) {
      return res.status(404).json({ error: "Flashcard not found" })
    }

    res.status(200).json({
      message: "Flashcard updated successfully",
      data: updatedFlashcard,
    })
  } catch (error) {
    console.error("❌ Error updating flashcard:", error)
    res.status(500).json({ error: "Failed to update flashcard" })
  }
})

// DELETE endpoint to delete a flashcard
router.delete("/flashcards/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid flashcard ID format" })
    }

    // Find and delete the flashcard
    const deletedFlashcard = await Flashcard.findByIdAndDelete(id)

    // Check if flashcard exists
    if (!deletedFlashcard) {
      return res.status(404).json({ error: "Flashcard not found" })
    }

    res.status(200).json({
      message: "Flashcard deleted successfully",
      data: deletedFlashcard,
    })
  } catch (error) {
    console.error("❌ Error deleting flashcard:", error)
    res.status(500).json({ error: "Failed to delete flashcard" })
  }
})

// !Updated route to fetch questions from the database
// router.get("/questions", async (req, res) => {
//   // Get subjects from query parameters (default empty array if not provided)
//   const subjects = req.query.subjects ? req.query.subjects.split(",") : [];
//   // Get the number of questions to return from query parameters
//   const numQuestions = parseInt(req.query.numQuestions, 10);

//   console.log("Requested Subjects:", subjects); // Debugging
//   console.log("Requested Total Number of Questions:", numQuestions); // Debugging

//   // If subjects or numQuestions are invalid, return an error response
//   if (subjects.length === 0 || isNaN(numQuestions)) {
//     return res.status(400).json({ message: "Invalid subjects or number of questions." });
//   }

//   try {
//     // Fetch questions from the database where the subject matches the request
//     const allQuestions = await Question.find({
//       subject: { $in: subjects }  // Match the selected subjects
//     }).limit(numQuestions);  // Limit the number of questions returned
//     console.log(allQuestions); // logg all questions for debugging purpose
//     // If no questions are found, return a 404 response
//     if (allQuestions.length === 0) {
//       return res.status(404).json({ message: "No questions found for the selected subjects." });
//     }

//     // Format the questions, adding explanation if missing
//     const formattedQuestions = allQuestions.map(q => ({
//       id: q._id,  // Use the MongoDB _id as the question ID
//       question: q.question,  // The question text
//       options: q.options,  // The answer options
//       answer: q.answer,  // The correct answer
//       explanation: q.explanation || "No explanation available." // If no explanation, use a default message
//     }));

//     // Return the formatted questions as the response
//     res.json(formattedQuestions);

//   } catch (err) {
//     // If there is an error, log it and return a 500 response
//     console.error("Error fetching questions from database:", err);
//     res.status(500).json({ message: "Error fetching questions." });
//   }
// });

router.get("/questions", async (req, res) => {
  try {
    // Parse query parameters (optional)
    const subjectIds = req.query.subjects ? req.query.subjects.split(",") : [];
    const systemIds = req.query.systems ? req.query.systems.split(",") : [];
    const count = req.query.count ? parseInt(req.query.count, 10) : null;

    console.log("Requested Subjects:", subjectIds);
    console.log("Requested Systems:", systemIds);
    console.log("Requested Total Number of Questions:", count);

    // Build query dynamically (only filter if params exist)
    let query = {};
    if (subjectIds.length) {
      query.subject = { $in: subjectIds };
    }
    if (systemIds.length) {
      query.subSection = { $in: systemIds };
    }

    // Fetch questions based on filters (or all if no filters are applied)
    let questionsQuery = Question.find(query)
      .populate("subject", "name")
      .populate("subsection", "name");

    if (count) {
      questionsQuery = questionsQuery.limit(count);
    }

    const allQuestions = await questionsQuery;

    // Check if no questions found
    if (allQuestions.length === 0) {
      return res.status(404).json({ message: "No questions found." });
    }

    // Format response
    const formattedQuestions = allQuestions.map(q => ({
      id: q._id,
      subject: q.subject?.name || "Unknown Subject",
      subSection: q.subSection?.name || "Unknown SubSection",
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation || "No explanation available."
    }));

    res.status(200).json(formattedQuestions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});




router.get("/get-questions", async (req, res) => {
  try {
    const questions = await Question.find().populate("subject")
    res.json(questions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Updated questions route (admin) question creation
router.post("/questions", async (req, res) => {
  try {
    const questions = req.body
    const savedQuestions = await Promise.all(
      questions.map(async (question) => {
        const subject = await Subject.findById(question.subject)
        const subsection = await Subsection.findById(question.subsection)
        if (!subject || !subsection) {
          throw new Error(`Subject or Subsection not found`)
        }
        const newQuestion = new Question({
          ...question,
          subject: subject._id,
          subsection: subsection._id,
        })
        return await newQuestion.save()
      }),
    )
    res.status(201).json(savedQuestions)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})
// !
// router.post("/questions", async (req, res) => {
//   try {
//     const { subjects, subsections, exam_type, difficulty, question_type } = req.query;

//     console.log(req.query);
//     const query = {
//       subject: { $in: subjects.split(',') },
//       subsection: { $in: subsections.split(',') },
//       exam_type: exam_type,
//       difficulty: difficulty,
//       question_type: question_type
//     };

//     const questions = await Question.find(query)
//       .populate('subject', 'name')
//       .populate('subsection', 'name');

//     // Update the question count in the subsection
//     await Question.updateTotalCount()
//     await Subsection.updateTotalCount()

//     res.json(questions);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// })


// * route for user's create-test 
router.get("/create-test/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find().populate('subsections');
    const subjectsWithCounts = subjects.map(subject => ({
      _id: subject._id,
      name: subject.name,
      count: subject.count,
      subsections: subject.subsections.map(subsection => ({
        _id: subsection._id,
        name: subsection.name,
        count: subsection.count
      }))
    }));
    res.json(subjectsWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// test route for Samad's Local Machine:
router.get("/create-test/subjects2", async (req, res) => {
  try {
    // Get all subjects with their subsections
    const subjects = await Subject.find().populate('subsections');
    
    // For each subject, count the questions
    const subjectsWithCounts = await Promise.all(subjects.map(async (subject) => {
      // Count questions for this subject (using string ID)
      const subjectCount = await Question.countDocuments({ subject: subject._id.toString() });
      
      // For each subsection, count the questions
      const subsectionsWithCounts = await Promise.all(subject.subsections.map(async (subsection) => {
        // Count questions for this subsection (using string ID)
        const subsectionCount = await Question.countDocuments({ subsection: subsection._id.toString() });
        
        return {
          _id: subsection._id,
          name: subsection.name,
          count: subsectionCount
        };
      }));
      
      return {
        _id: subject._id,
        name: subject.name,
        count: subjectCount,
        subsections: subsectionsWithCounts
      };
    }));
    
    res.json(subjectsWithCounts);
  } catch (error) {
    console.error("Error in /create-test/subjects2:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/create-test/filtered-questions", async (req, res) => {
  try {
    const { subjects, subsections, exam_type, difficulty, question_type, year } = req.query

    // Validate required parameters
    if (!subjects || !subsections) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["subjects", "subsections"],
      })
    }

    // Build the query with support for "All" options
    const query = {
      subject: { $in: subjects.split(",") },
      subsection: { $in: subsections.split(",") },
    }

    // Only add exam_type to query if it's not "ALL_USMLE_TYPES"
    if (exam_type && exam_type !== "ALL_USMLE_TYPES") {
      query.exam_type = exam_type
    }

    // Only add difficulty to query if it's not "ALL_DIFFICULTY_LEVELS"
    if (difficulty && difficulty !== "ALL_DIFFICULTY_LEVELS") {
      query.difficulty = difficulty
    }

    // Only add question_type to query if it's not "ALL_QUESTION_TYPES"
    if (question_type && question_type !== "ALL_QUESTION_TYPES") {
      query.question_type = question_type
    }

    // Only add year to query if it's not "ALL_YEARS"
    if (year && year !== "ALL_YEARS") {
      query.year = Number.parseInt(year, 10)
    }

    // Log the query for debugging
    console.log("Query:", JSON.stringify(query, null, 2))

    const questions = await Question.find(query)
      .populate("subject", "name")
      .populate("subsection", "name")
      .select("-options -answer -explanation") // Exclude these fields from the initial fetch

    // Log the results count
    console.log(`Found ${questions.length} questions matching the criteria`)

    res.json({
      count: questions.length,
      questions: questions,
    })
  } catch (error) {
    console.error("Error fetching filtered questions:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get a single question by ID (including options, answer, and explanation)
router.get("/create-test/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('subject', 'name')
      .populate('subsection', 'name');

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// * ends route for user's create-test 

// router.get("/subject", async (req, res) => {
//   try {
//     const subjects = await Subject.find({})
//     res.json(subjects)
//   } catch (error) {
//     res.status(500).json({ error: error.message })
//   }
// })

// * route for user's take-test 


router.get("/take-test/questions", async (req, res) => {
  try {
    const { subjects, subsections, count } = req.query
    const query = {}
    if (subjects) query.subject = { $in: subjects.split(",") }
    if (subsections) query.subsection = { $in: subsections.split(",") }

    const questions = await Question.find(query).limit(Number.parseInt(count))
    res.json(questions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// *Submit test attempt and update analytics
router.post("/take-test/submit-test", async (req, res) => {
  try {
    const { userId, questions, score, totalTime, percentage } = req.body
    console.log(req.body);
    const testData = new TestData({
      userId,
      questions,
      score,
      totalTime,
      percentage
    })

    await testData.save()
    await updateLeaderboard(userId, score, totalTime);
    await streakManager.updateStreak(userId)

    try {
      const category = await addWrongQuestionsToFlashcards(userId, questions);
      console.log(`Wrong questions added to flashcards under category: ${category}`);
    } catch (flashcardError) {
      console.error("Error adding wrong questions to flashcards:", flashcardError);
      // Continue execution even if flashcard creation fails
    }

    res.status(201).json({ message: "Test attempt submitted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get question analytics
router.get("/take-test/question-analytics/:questionId", async (req, res) => {
  try {
    const questionId = req.params.questionId // Keep as String (no conversion needed)

    const analytics = await TestData.aggregate([
      { $unwind: "$questions" },
      { $match: { "questions.questionId": questionId } }, // Match as String
      {
        $group: {
          _id: "$questions.questionId",
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: { $cond: [{ $eq: ["$questions.userAnswer", "$questions.correctAnswer"] }, 1, 0] },
          },
          totalTime: { $sum: "$questions.timeSpent" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude MongoDB ID
          totalAttempts: 1,
          avgResponseTime: { $divide: ["$totalTime", "$totalAttempts"] },
          correctPercentage: {
            $multiply: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 100],
          },
        },
      },
    ])

    if (!analytics.length) {
      return res.status(404).json({ message: "No analytics found for this question" })
    }

    res.json(analytics[0]) // Return the first (and only) result
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// * ends routes for user's take-test 

// Get subject stats
router.get("/subject/:subjectId/stats", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId)
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" })
    }

    const subsections = await Subsection.find({ subject: req.params.subjectId })

    // Recalculate counts to ensure accuracy
    await Promise.all(subsections.map((subsection) => subsection.updateQuestionCount()))
    await subject.updateTotalCount()

    res.json({
      subject: {
        id: subject._id,
        name: subject.name,
        totalQuestions: subject.count,
      },
      subsections: subsections.map((sub) => ({
        id: sub._id,
        name: sub.name,
        questionCount: sub.count,
      })),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// / Get all subjects
router.get("/subject", async (req, res) => {
  try {
    const subjects = await Subject.find({})
    res.json(subjects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create subject
router.post("/subject", async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" })
    }

    // Check for duplicate name
    const existingSubject = await Subject.findOne({ name: name.trim() })
    if (existingSubject) {
      return res.status(400).json({ error: "Subject with this name already exists" })
    }

    const subject = new Subject({
      name: name.trim(),
      count: 0,
      subsections: [],
    })
    await subject.save()
    res.status(201).json(subject)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subject
router.put("/subject/:id", async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" })
    }

    // Check for duplicate name
    const existingSubject = await Subject.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    })
    if (existingSubject) {
      return res.status(400).json({ error: "Subject with this name already exists" })
    }

    const subject = await Subject.findByIdAndUpdate(req.params.id, { name: name.trim() }, { new: true })
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" })
    }
    res.json(subject)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete subject
router.delete("/subject/:id", async (req, res) => {
  try {
    console.log("🗑️ Deleting subject with ID:", req.params.id);
    const mongooseSubjectId = new mongoose.Types.ObjectId(req.params.id);

    const subject = await Subject.findById(mongooseSubjectId);
    if (!subject) {
      console.log("❌ Subject not found");
      return res.status(404).json({ error: "Subject not found" });
    }

    // Find all subsections related to the subject
    const subsections = await Subsection.find({ subject: mongooseSubjectId });

    for (const subsection of subsections) {
      console.log("🗑️ Deleting questions for subsection ID:", subsection._id);
      await Question.deleteMany({ subSection: subsection._id });

      console.log("🗑️ Deleting subsection ID:", subsection._id);
      await Subsection.deleteOne({ _id: subsection._id }); // FIXED
    }

    console.log("🗑️ Deleting subject ID:", subject._id);
    await Subject.deleteOne({ _id: subject._id }); // FIXED

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting subject:", error.message);
    res.status(500).json({ error: error.message });
  }
});


// Get subsections by subject
router.get("/subject/:subjectId/subsections", async (req, res) => {
  try {
    const subsections = await Subsection.find({ subject: req.params.subjectId })
    res.json(subsections)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all subsections
router.get("/subsection", async (req, res) => {
  try {
    const subsections = await Subsection.find({})
    res.json(subsections)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create subsection
router.post("/subsection", async (req, res) => {
  try {
    const { name, subject } = req.body
    if (!name || !name.trim() || !subject) {
      return res.status(400).json({ error: "Name and subject are required" })
    }

    // Check if subject exists
    const existingSubject = await Subject.findById(subject)
    if (!existingSubject) {
      return res.status(404).json({ error: "Subject not found" })
    }

    // Check for duplicate name within the same subject
    const existingSubsection = await Subsection.findOne({
      name: name.trim(),
      subject,
    })
    if (existingSubsection) {
      return res.status(400).json({ error: "Subsection with this name already exists in this subject" })
    }

    const subsection = new Subsection({
      name: name.trim(),
      subject,
      count: 0,
    })
    await subsection.save()

    // Update subject's subsections array
    existingSubject.subsections.push(subsection._id)
    await existingSubject.save()

    res.status(201).json(subsection)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subsection
router.put("/subsection/:id", async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" })
    }

    const subsection = await Subsection.findById(req.params.id)
    if (!subsection) {
      return res.status(404).json({ error: "Subsection not found" })
    }

    // Check for duplicate name within the same subject
    const existingSubsection = await Subsection.findOne({
      name: name.trim(),
      subject: subsection.subject,
      _id: { $ne: req.params.id },
    })
    if (existingSubsection) {
      return res.status(400).json({ error: "Subsection with this name already exists in this subject" })
    }

    subsection.name = name.trim()
    await subsection.save()
    res.json(subsection)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete subsection
router.delete("/subsection/:id", async (req, res) => {
  try {
    const subsection = await Subsection.findById(req.params.id)
    if (!subsection) {
      return res.status(404).json({ error: "Subsection not found" })
    }

    // Delete all associated questions
    await Question.deleteMany({ subSection: req.params.id })

    // Remove subsection from subject's subsections array
    const subject = await Subject.findById(subsection.subject)
    if (subject) {
      subject.subsections = subject.subsections.filter((sid) => sid.toString() !== req.params.id)
      await subject.save()
    }

    await subsection.remove()
    res.json({ message: "Subsection deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, verifiedUsers, totalSubjects, totalQuestions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Subject.countDocuments(),
      Question.countDocuments(),
    ])

    res.json({
      totalUsers,
      verifiedUsers,
      totalSubjects,
      totalQuestions,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})



// router.get("/quest", async (req, res) => {
//   try {
//     const { userId } = req.query
//     const quest = await Quest.findById(userId)
//     if (quest) {
//       quest.updateElapsedHours();
//       await quest.save();
//     }

//     const quests = await Quest.find({ userId }).sort({ createdAt: -1 })

//     res.status(200).json({
//       success: true,
//       data: quests,
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: "Server Error",
//     })
//   }
// })

// router.post("/quest", async (req, res) => {
//   try {
//     const { userId, subject, description, targetHours, dueDate } = req.body
//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid user ID",
//       })
//     }

//     // Validate required fields
//     if (!subject || !description || !targetHours || !dueDate) {
//       return res.status(400).json({
//         success: false,
//         error: "All fields are required",
//       })
//     }

//     const quest = await Quest.create({
//       userId,
//       subject,
//       description,
//       targetHours,
//       dueDate,
//       completedHours: 0,
//       isCompleted: false,
//     })

//     res.status(201).json({
//       success: true,
//       data: quest,
//     })

//   } catch (error) {
//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message)
//       return res.status(400).json({
//         success: false,
//         error: messages,
//       })
//     }
//     res.status(500).json({
//       success: false,
//       error,
//       message: "Server Error",
//     })
//   }
// })

// router.patch("/quest/:id", async (req, res) => {
//   try {
//     const { userId } = req.body
//     const questId = req.params.id

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid user ID or quest ID",
//       })
//     }

//     let quest = await Quest.findOne({ _id: questId, userId })

//     if (!quest) {
//       return res.status(404).json({
//         success: false,
//         error: "Quest not found or unauthorized",
//       })
//     }

//     // Remove userId from updates to prevent ownership change
//     const { userId: _, ...updates } = req.body

//     quest = await Quest.findOneAndUpdate({ _id: questId, userId }, updates, {
//       new: true,
//       runValidators: true,
//     })

//     res.status(200).json({
//       success: true,
//       data: quest,
//     })
//   } catch (error) {
//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message)
//       return res.status(400).json({
//         success: false,
//         error: messages,
//       })
//     }
//     res.status(500).json({
//       success: false,
//       error: "Server Error",
//     })
//   }
// })

// router.delete("/quest/:id", async (req, res) => {
//   try {
//     const { userId } = req.query
//     const questId = req.params.id

//     const quest = await Quest.findOne({ _id: questId, userId })

//     if (!quest) {
//       return res.status(404).json({
//         success: false,
//         error: "Quest not found or unauthorized",
//       })
//     }

//     await Quest.deleteOne({ _id: questId, userId })

//     res.status(200).json({
//       success: true,
//       data: {},
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: "Server Error",
//     })
//   }
// })

// router.patch("/complete/:id", async (req, res) => {
//   try {
//     // const { userId } = req.query
//     const questId = req.params.id
//     console.log(questId);
//     const quest = await Quest.findOne({ _id: questId })

//     if (!quest) {
//       return res.status(404).json({
//         success: false,
//         error: "Quest not found or unauthorized",
//       })
//     }

//     await Quest.updateOne({ _id: questId, isCompleted: true })

//     res.status(200).json({
//       success: true,
//       data: {},
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: "Server Error",
//     })
//   }
// })


router.patch('/calender/completion/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  try {
    const updatedTest = await Calender.findByIdAndUpdate(
      id,
      { completed },
      { new: true }
    );

    if (!updatedTest) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json(updatedTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update test status' });
  }
});

router.get('/calender/:userId', async (req, res) => {
  try {
    const Calenders = await Calender.find({ userId: req.params.userId });
    res.json(Calenders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new Calender
router.post('/calender', async (req, res) => {
  try {
    const calender = await Calender.create(({
      userId: req.body.userId,
      subjectName: req.body.subjectName,
      testTopic: req.body.testTopic,
      date: req.body.date,
      color: req.body.color,
      completed: req.body.completed
    }));


    res.status(201).json(calender);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a Calender
router.delete('/calender/:id', async (req, res) => {
  try {
    await Calender.findByIdAndDelete(req.params.id);
    res.json({ message: 'Calender deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// * performance-tracking APIs start
// Get performance data
router.get("/user/:userId/stats", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    // Total Tests Taken
    const totalTestsTaken = await TestData.countDocuments({ userId: userId });

    // Total Questions Attempted
    const totalQuestionsAttempted = await TestData.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$user", totalQuestions: { $sum: { $size: "$questions" } } } }
    ]);

    // Total Questions Answered Correctly
    const totalQuestionsCorrect = await TestData.aggregate([
      { $match: { userId: userId } },
      { $unwind: "$questions" },
      { $match: { $expr: { $eq: ["$questions.userAnswer", "$questions.correctAnswer"] } } },
      { $count: "totalCorrect" }
    ]);

    // Total Questions Answered Incorrectly
    const totalQuestionsWrong = await TestData.aggregate([
      { $match: { userId: userId } },
      { $unwind: "$questions" },
      { $match: { $expr: { $ne: ["$questions.userAnswer", "$questions.correctAnswer"] } } },
      { $count: "totalWrong" }
    ]);

    // Average Time per Test
    const avgTimePerTest = await TestData.aggregate([
      { $match: { userId: userId } }, // Match tests taken by this user
      { $group: { _id: "$userId", avgTime: { $avg: "$totalTime" } } } // Calculate avg time
    ]);


    // Subject & Subsection Efficiency (Accuracy Per Subject)
    const subjectEfficiency = await TestData.aggregate([
      { $match: { userId: userId } }, // Get tests for the user
      { $unwind: "$questions" }, // Unwind questions array
      {
        $lookup: {
          from: "questions", // Join with Question collection
          localField: "questions.questionText", // Match based on questionText
          foreignField: "question", // In Question collection
          as: "questionData",
        },
      },
      { $unwind: "$questionData" }, // Convert array to object
      {
        $group: {
          _id: { subject: "$questionData.subject", subsection: "$questionData.subsection" },
          totalAnswered: { $sum: 1 },
          correctAnswers: {
            $sum: {
              $cond: [{ $eq: ["$questions.userAnswer", "$questions.correctAnswer"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "subjects", // Join with Subjects collection
          localField: "_id.subject",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" }, // Get subject name
      {
        $lookup: {
          from: "subsections", // Join with Subsections collection
          localField: "_id.subsection",
          foreignField: "_id",
          as: "subsection",
        },
      },
      { $unwind: "$subsection" }, // Get subsection name
      {
        $project: {
          _id: 0,
          subject: "$subject.name",
          subsection: "$subsection.name",
          accuracy: { $multiply: [{ $divide: ["$correctAnswers", "$totalAnswered"] }, 100] },
        },
      },
      { $sort: { accuracy: -1 } }, // Sort by accuracy
    ]);

    // const logg = {
    //   totalTestsTaken,
    //   totalQuestionsAttempted: totalQuestionsAttempted[0]?.totalQuestions || 0,
    //   totalQuestionsCorrect: totalQuestionsCorrect[0]?.totalCorrect || 0,
    //   totalQuestionsWrong: totalQuestionsWrong[0]?.totalWrong || 0,
    //   avgTimePerTest: avgTimePerTest[0]?.avgTime || 0,
    //   subjectEfficiency
    // }

    // console.log(
    //   logg
    // );

    res.json({
      totalTestsTaken,
      totalQuestionsAttempted: totalQuestionsAttempted[0]?.totalQuestions || 0,
      totalQuestionsCorrect: totalQuestionsCorrect[0]?.totalCorrect || 0,
      totalQuestionsWrong: totalQuestionsWrong[0]?.totalWrong || 0,
      avgTimePerTest: avgTimePerTest[0]?.avgTime || 0,
      subjectEfficiency
    });

  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Get detailed statistics
router.get("/stats", async (req, res) => {
  try {
    const { userId } = req.query

    // Get all tests for the user
    const tests = await TestData.find({ userId })

    // Calculate basic statistics
    const totalTests = tests.length
    let totalQuestions = 0
    let correctAnswers = 0
    let wrongAnswers = 0
    let totalTime = 0

    // Subject efficiency tracking
    const subjectStats = {}

    tests.forEach((test) => {
      totalTime += test.totalTime
      totalQuestions += test.questions.length

      test.questions.forEach((question) => {
        if (question.userAnswer === question.correctAnswer) {
          correctAnswers++
        } else {
          wrongAnswers++
        }

        // Track subject performance
        // Note: You'll need to modify this based on your actual data structure
        const subject = question.subject || "General"
        const subsection = question.subsection || "General"

        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            correct: 0,
            total: 0,
            subsections: {},
          }
        }

        if (!subjectStats[subject].subsections[subsection]) {
          subjectStats[subject].subsections[subsection] = {
            correct: 0,
            total: 0,
          }
        }

        subjectStats[subject].total++
        subjectStats[subject].subsections[subsection].total++

        if (question.userAnswer === question.correctAnswer) {
          subjectStats[subject].correct++
          subjectStats[subject].subsections[subsection].correct++
        }
      })
    })

    // Calculate subject efficiency
    const subjectEfficiency = Object.entries(subjectStats)
      .map(([subject, data]) => {
        const accuracy = (data.correct / data.total) * 100

        // Find best performing subsection
        const bestSubsection = Object.entries(data.subsections)
          .map(([name, stats]) => ({
            name,
            accuracy: (stats.correct / stats.total) * 100,
          }))
          .sort((a, b) => b.accuracy - a.accuracy)[0]

        return {
          subject,
          subsection: bestSubsection?.name || "N/A",
          accuracy,
          totalQuestions: data.total,
        }
      })
      .sort((a, b) => b.accuracy - a.accuracy)

    res.json({
      totalTests,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      averageTime: totalTests ? totalTime / totalTests : 0,
      subjectEfficiency,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})
// * performance-tracking APIs end



// 
router.get("/daily-challenge", async (req, res) => {
  try {

    // Find the user by id
    console.log(req.query)
    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set today's date to midnight (local server time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look for an existing global challenge for today
    let dailyChallenge = await DailyChallenge.findOne({
      date: { $gte: today },
      isGlobal: true,
    }).populate("questions");

    // If no challenge exists, create one
    if (!dailyChallenge) {
      // Get 10 random questions from the Question collection
      const questions = await Question.aggregate([{ $sample: { size: 10 } }]);

      if (questions.length < 10) {
        return res.status(500).json({ error: "Not enough questions available" });
      }

      // Create a new daily challenge document
      dailyChallenge = await DailyChallenge.create({
        date: today,
        questions: questions.map((q) => q._id),
        isGlobal: true,
      });

      // Re-fetch the challenge to populate the questions
      dailyChallenge = await DailyChallenge.findById(dailyChallenge._id).populate("questions");
    }

    // Check if the user has already completed today's challenge
    const userProgress = await DailyChallenge.findOne({
      user: user._id,
      date: { $gte: today },
      isGlobal: false,
    });

    await streakManager.updateStreak(userId)

    return res.json({
      challenge: dailyChallenge,
      completed: !!userProgress,
      progress: userProgress,
    });
  } catch (error) {
    console.error("Error fetching daily challenge:", error);
    return res.status(500).json({ error: "Failed to fetch daily challenge" });
  }
});

router.post("/daily-challenge", async (req, res) => {
  try {
    console.log("🟢 [API CALL] /daily-challenge endpoint hit");

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    console.log(`🔍 Checking user with ID: ${userId}`);

    const user = await User.findById(userId);
    console.log(user)
    if (!user) {
      console.warn("⚠️ User not found");
      return res.status(404).json({ error: "User not found" });
    }
    console.log("✅ User found");

    const { challengeId, answers } = req.body;
    console.log(`📋 Received challengeId: ${challengeId}, answers: ${JSON.stringify(answers)}`);

    if (!challengeId || !answers) {
      console.warn("❌ Missing challengeId or answers");
      return res.status(400).json({ error: "challengeId and answers are required" });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate("questions");
    if (!challenge) {
      console.warn("⚠️ Challenge not found");
      return res.status(404).json({ error: "Challenge not found" });
    }
    console.log(`✅ Challenge found with ${challenge.questions.length} questions`);

    let score = 0;
    const results = challenge.questions.map((question, index) => {
      const isCorrect = answers[index] === question.answer;
      if (isCorrect) score++;
      return {
        questionId: question._id,
        userAnswer: answers[index],
        correct: isCorrect,
      };
    });

    console.log(`🎯 Score calculated: ${score}/${challenge.questions.length}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await DailyChallenge.create({
      user: user._id,
      date: today,
      questions: challenge.questions.map((q) => q._id),
      answers,
      score,
      completed: true,
      isGlobal: false,
    });

    console.log("✅ Daily challenge successfully recorded");

    return res.json({
      success: true,
      score,
      total: challenge.questions.length,
      results,
    });
  } catch (error) {
    console.error("🛑 Error submitting daily challenge:", error);
    return res.status(500).json({ error: "Failed to submit daily challenge" });
  }
});

// 






// ! old question route
// router.post("/questions", async (req, res) => {
//   try {
//     const { subjectId, subSectionId, question, options, answer, explanation } = req.body;

//     // Validate subject
//     const subject = await Subject.findById(subjectId);
//     if (!subject) return res.status(404).json({ error: "Subject not found" });

//     // Validate subSection
//     const subSection = await Subsection.findById(subSectionId);
//     if (!subSection) return res.status(404).json({ error: "SubSection not found" });

//     // Create new question
//     const newQuestion = new Question({
//       subject: subjectId,
//       subSection: subSectionId,
//       question,
//       options,
//       answer,
//       explanation
//     });

//     await newQuestion.save();

//     res.status(201).json({ message: "Question created successfully", question: newQuestion });
//   } catch (error) {
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// });


// router.get("/subjects", async (req, res) => {
//   try {
//     const subjects = await Subject.find().populate("subsections");
//     res.json(subjects);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// })

// router.post("/subjects", async (req, res) => {
//   try {
//     const { name, count } = req.body;
//     const subject = new Subject({ name, count, subsections: [] });
//     await subject.save();
//     res.status(201).json(subject);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });


// router.get("/subsections", async (req, res) => {
//   // try {
//   //   const subsections = await Subsection.find().populate("subject", "name");
//   //   res.json(subsections);
//   // } catch (error) {
//   //   res.status(500).json({ message: error.message });
//   // }
//   try {
//     const subsections = await Subsection.find({ subject: req.query.subjectId })
//     return res.json(subsections)
//   } catch (error) {
//     return res.json({ error: error.message }, { status: 500 })
//   }
// });

// // API: Create a new subsection and link it to a subject
// router.post("/subsections", async (req, res) => {
//   try {
//     const { name, subjectId } = req.body;

//     const subject = await Subject.findById(subjectId);
//     if (!subject) return res.status(404).json({ message: "Subject not found" });

//     const subsection = new Subsection({ name, subject: subjectId });
//     await subsection.save();

//     // Update subject with new subsection
//     subject.subsections.push(subsection._id);
//     await subject.save();

//     res.status(201).json(subsection);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });


// router.post('/create-test', async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { subject, subsection, questions } = req.body;

//     console.log("Received Data:", req.body); // Debugging

//     // Validate required fields
//     if (!subject?.trim() || !subsection?.trim() || !Array.isArray(questions) || questions.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: "Subject, subsection, and at least one question are required.",
//       });
//     }

//     // 1. Create subject
//     const newSubject = await Subject.create([{ name: subject.trim() }], { session, ordered: true });

//     // 2. Create subsection linked to the subject
//     const newSubsection = await Subsection.create(
//       [{ name: subsection.trim(), subject: newSubject[0]._id }],
//       { session, ordered: true }
//     );

//     // Update subject with subsection reference
//     await Subject.findByIdAndUpdate(
//       newSubject[0]._id,
//       {
//         $push: { subsections: newSubsection[0]._id },
//         $set: { count: questions?.length || 0 }
//       },
//       { session }
//     );

//     // 3. Create questions
//     const questionDocs = questions.map(q => ({
//       subject: newSubject[0]._id,
//       subSection: newSubsection[0]._id,
//       question: q.question?.trim() || "Untitled Question",
//       options: Array.isArray(q.options) ? q.options.map(opt => opt.trim()) : [],
//       answer: q.answer?.trim() || "No answer provided",
//       explanation: q.explanation?.trim() || "No explanation available",
//     }));

//     const newQuestions = await Question.create(questionDocs, { session, ordered: true });

//     // Commit transaction
//     await session.commitTransaction();

//     res.status(201).json({
//       success: true,
//       data: {
//         subject: newSubject[0],
//         subsection: newSubsection[0],
//         questions: newQuestions,
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error creating test:", error);
//     res.status(500).json({
//       success: false,
//       error: "Error creating test. Please try again.",
//       details: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// });


//  ! for testing

// router.post("/bulk", async (req, res) => {
//   const questions = req.body; // Expecting an array of questions

//   if (!Array.isArray(questions) || questions.length === 0) {
//     return res.status(400).json({ error: "Request body must be a non-empty array of questions" });
//   }

//   try {
//     let subjectMap = {}; // Store subject references to avoid duplicate lookups
//     let subsectionMap = {}; // Store subsection references to avoid duplicate lookups
//     let bulkQuestions = [];

//     for (let { subject, subsections, question, options, answer, explanation } of questions) {
//       if (!subject || !subsections || !question || !options || !answer) {
//         return res.status(400).json({ error: "Missing required fields in one of the entries" });
//       }

//       // 1️⃣ Find or create the Subject
//       if (!subjectMap[subject]) {
//         let subjectDoc = await Subject.findOneAndUpdate(
//           { name: subject },
//           { $setOnInsert: { name: subject, subsections: [], count: 0 } },
//           { upsert: true, new: true }
//         );
//         subjectMap[subject] = subjectDoc._id;
//       }

//       let subsectionIds = [];
//       let newSubsections = []; // To track new subsections

//       for (let subName of subsections) {
//         let subKey = `${subject}-${subName}`; // Unique key for subsections under the same subject
//         if (!subsectionMap[subKey]) {
//           let subsectionDoc = await Subsection.findOneAndUpdate(
//             { name: subName, subject: subjectMap[subject] },
//             { $setOnInsert: { name: subName, subject: subjectMap[subject], count: 0 } },
//             { upsert: true, new: true }
//           );
//           subsectionMap[subKey] = subsectionDoc._id;

//           // Track new subsections for pushing to the subject
//           newSubsections.push(subsectionDoc._id);
//         }
//         subsectionIds.push(subsectionMap[subKey]);
//       }

//       // 3️⃣ Push new subsection IDs to Subject.subsections
//       if (newSubsections.length > 0) {
//         await Subject.findByIdAndUpdate(subjectMap[subject], {
//           $addToSet: { subsections: { $each: newSubsections } }
//         });
//       }

//       // 4️⃣ Prepare bulk insert for Questions
//       bulkQuestions.push({
//         subject: subjectMap[subject],
//         subSection: subsectionIds[0], // Assigning first subsection ID (Modify if needed)
//         question,
//         options,
//         answer,
//         explanation: explanation || "No explanation available."
//       });
//     }

//     // 5️⃣ Insert all questions in one go
//     await Question.insertMany(bulkQuestions);

//     // 6️⃣ Update Subject & Subsection counts efficiently
//     await Promise.all([
//       ...Object.values(subjectMap).map(subjectId =>
//         Subject.findByIdAndUpdate(subjectId, { $inc: { count: 1 } })
//       ),
//       ...Object.values(subsectionMap).map(subId =>
//         Subsection.findByIdAndUpdate(subId, { $inc: { count: 1 } })
//       )
//     ]);

//     res.status(201).json({ message: "Questions added successfully", insertedCount: bulkQuestions.length });

//   } catch (error) {
//     console.error("Bulk Insert Error:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// });

// router.get("/questions", (req, res) => {
//   const subjects = req.query.subjects ? req.query.subjects.split(",") : [];
//   const numQuestions = parseInt(req.query.numQuestions, 10);
//   console.log("Requested Subjects:", subjects); // Debugging
//   console.log("Requested Total Number of Questions:", numQuestions); // Debugging

//   if (subjects.length === 0 || isNaN(numQuestions)) {
//     return res.status(400).json({ message: "Invalid subjects or number of questions." });
//   }

//   // Read questions.json file
//   fs.readFile(questionsFilePath, "utf8", (err, data) => {
//     if (err) {
//       console.error("Error reading questions file:", err);
//       return res.status(500).json({ message: "Error reading data." });
//     }

//     try {
//       const questionsData = JSON.parse(data);
//       let allSelectedQuestions = [];

//       // Calculate the number of questions per subject
//       const questionsPerSubject = Math.floor(numQuestions / subjects.length);
//       let remainingQuestions = numQuestions % subjects.length;

//       subjects.forEach(subject => {
//         const subjectQuestions = questionsData[subject] || [];
//         if (subjectQuestions.length === 0) {
//           console.warn(`No questions found for subject: ${subject}`);
//           return;
//         }

//         // Select questions for the current subject
//         const selectedQuestions = subjectQuestions.slice(0, questionsPerSubject + (remainingQuestions > 0 ? 1 : 0));
//         remainingQuestions = Math.max(0, remainingQuestions - 1);

//         allSelectedQuestions = allSelectedQuestions.concat(selectedQuestions);
//       });

//       if (allSelectedQuestions.length === 0) {
//         return res.status(404).json({ message: "No questions found for the selected subjects." });
//       }

//       res.json(allSelectedQuestions);
//     } catch (parseError) {
//       console.error("Error parsing questions data:", parseError);
//       return res.status(500).json({ message: "Error processing data." });
//     }
//   });
// });
const { saveTestResults, getTestResults } = require("../controllers/testController");
router.post("/submit-test", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body)
    const { userId, questions, score, totalTime, percentage } = req.body

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" })
    }

    // Validate required question fields
    for (const question of questions) {
      if (
        !question.questionText ||
        question.userAnswer === undefined ||
        !question.correctAnswer ||
        question.timeSpent === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields in questions" })
      }
    }

    // Validate percentage
    if (percentage === undefined || typeof percentage !== "number") {
      return res.status(400).json({ error: "Invalid or missing percentage" })
    }

    const newTestResult = new TestData({
      userId,
      questions,
      score,
      totalTime,
      percentage,
    })
    await newTestResult.save()
    // Update leaderboard
    await updateLeaderboard(userId, score, totalTime);


    try {
      const category = await addWrongQuestionsToFlashcards(userId, questions);
      console.log(`Wrong questions added to flashcards under category: ${category}`);
    } catch (flashcardError) {
      console.error("Error adding wrong questions to flashcards:", flashcardError);
      // Continue execution even if flashcard creation fails
    }


    res.status(201).json({ message: "Test results saved successfully" })
  } catch (error) {
    console.error("Error saving test results:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

async function updateLeaderboard(userId, score, time) {
  try {
    // Fetch user name from User collection
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userName = user.name;

    // Find the user's entry in the leaderboard
    const leaderboardEntry = await Leaderboard.findOne({ userId });

    if (leaderboardEntry) {
      // If entry exists, update the score
      leaderboardEntry.score += score;
      leaderboardEntry.totalTime += parseInt(time, 10);
      await leaderboardEntry.save();
    } else {
      // If no entry exists, create a new one
      const newLeaderboardEntry = new Leaderboard({
        userId,
        name: userName,
        score,
        totalTime: time
      });
      await newLeaderboardEntry.save();
    }
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    throw error;
  }
}

async function addWrongQuestionsToFlashcards(userId, questions) {
  try {
    // Filter out only the questions that were answered incorrectly
    const wrongQuestions = questions.filter(
      (question) => question.userAnswer !== question.correctAnswer
    );

    if (wrongQuestions.length === 0) {
      console.log("No wrong questions to add to flashcards");
      return;
    }

    console.log(`Adding ${wrongQuestions.length} wrong questions to flashcards for user ${userId}`);

    // Use a unified category for all wrong questions
    const category = "Mistakes";

    // Create flashcards for each wrong question one by one
    for (const question of wrongQuestions) {
      console.log(`Processing wrong question: ${question.questionText}`);

      try {
        // Check if this exact question already exists as a flashcard for this user
        const existingFlashcard = await Flashcard.findOne({
          userId: userId,
          question: question.questionText
        });

        if (existingFlashcard) {
          console.log(`Found existing flashcard for question: ${question.questionText}`);
          // Update the existing flashcard
          existingFlashcard.reviewCount += 1;
          existingFlashcard.mastery = Math.max(0, existingFlashcard.mastery - 10);
          existingFlashcard.lastReviewed = new Date();
          existingFlashcard.category = category; // Set to the unified category
          await existingFlashcard.save();
          console.log(`Updated existing flashcard for question ID: ${existingFlashcard._id}`);
        } else {
          // Create a new flashcard
          const newFlashcard = new Flashcard({
            question: question.questionText,
            answer: question.correctAnswer,
            category,
            userId,
            hint: "", // Empty hint for now
            difficulty: 'medium',
            tags: ['mistake', 'test-review'],
            lastReviewed: new Date(),
            reviewCount: 1,
            mastery: 0
          });

          const savedFlashcard = await newFlashcard.save();
          console.log(`Created new flashcard with ID: ${savedFlashcard._id}`);
        }
      } catch (err) {
        console.error(`Error processing question "${question.questionText}":`, err);
        // Continue with other questions instead of failing the entire process
      }
    }

    console.log(`Successfully processed wrong questions to flashcards under category: ${category}`);
    return category; // Return the category for reference
  } catch (error) {
    console.error("Error in addWrongQuestionsToFlashcards:", error);
    // Don't throw the error, so it doesn't break the test submission flow
    return null;
  }
}



// Route to submit test results
// router.post("/submit-test", async (req, res) => {
//   try {
//     console.log("Incoming request body:", req.body);
//     const { userId, questions, score, totalTime } = req.body;

//     // Validate userId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: "Invalid userId format" });
//     }

//     // Validate required question fields
//     for (const question of questions) {
//       if (
//         !question.questionText ||
//         question.userAnswer === undefined ||
//         !question.correctAnswer ||
//         question.timeSpent === undefined
//       ) {
//         return res.status(400).json({ error: "Missing required fields in questions" });
//       }
//     }

//     const newTestResult = new TestData(req.body);
//     await newTestResult.save();

//     res.status(201).json({ message: "Test results saved successfully" });
//   } catch (error) {
//     console.error("Error saving test results:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });



// smart stude calender new additions 


router.get("/exams/blueprint/:examName", async (req, res) => {
  try {
    const { examName } = req.params;

    if (!examName) {
      return res.status(400).json({ error: "Exam name is required" });
    }

    // Map exam names to subjects
    const examSubjectsMap = {
      "USMLE Step 1": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"],
      "NEET": ["Physics", "Chemistry", "Biology", "Zoology", "Botany"],
      "PLAB": ["Clinical Medicine", "Surgery", "Obstetrics", "Gynecology", "Psychiatry"],
      "MCAT": ["Biology", "Chemistry", "Physics", "Psychology"],
      "NCLEX": ["Fundamentals", "Medical-Surgical", "Pharmacology", "Maternal Newborn", "Pediatrics"],
      "COMLEX": ["Osteopathic Principles", "Anatomy", "Microbiology", "Pathology", "Pharmacology"]
    };

    const examSubjects = examSubjectsMap[examName];

    if (!examSubjects || examSubjects.length === 0) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Find subjects in the database
    const subjectPromises = examSubjects.map(async (subjectName) => {
      try {
        // Try to find the subject by name
        const subjectDocs = await Subject.find({
          name: { $regex: new RegExp(subjectName, 'i') }
        });

        if (subjectDocs.length === 0) {
          return { topic: subjectName, count: 0 };
        }

        // Get subject IDs
        const subjectIds = subjectDocs.map(doc => doc._id);

        // Count questions for this subject
        const questionCount = await Question.countDocuments({
          subject: { $in: subjectIds }
        });

        return {
          topic: subjectName,
          count: questionCount
        };
      } catch (error) {
        console.error(`Error finding questions for ${subjectName}:`, error);
        return { topic: subjectName, count: 0 };
      }
    });

    const subjectsWithCounts = await Promise.all(subjectPromises);
    const totalQuestions = subjectsWithCounts.reduce((sum, subject) => sum + subject.count, 0);

    let blueprint;

    if (totalQuestions > 0) {
      // Calculate percentages based on question counts
      blueprint = subjectsWithCounts.map(subject => ({
        topic: subject.topic,
        percentage: Math.round((subject.count / totalQuestions) * 100)
      }));

      // Normalize percentages to ensure they sum to 100%
      let totalPercentage = blueprint.reduce((sum, item) => sum + item.percentage, 0);

      if (totalPercentage !== 100) {
        // Sort by percentage (highest first)
        blueprint.sort((a, b) => b.percentage - a.percentage);

        // Adjust the largest value to make sum exactly 100%
        blueprint[0].percentage += (100 - totalPercentage);
      }
    } else {
      // If no questions found, create even distribution
      const evenPercentage = Math.floor(100 / examSubjects.length);
      const remainder = 100 - (evenPercentage * examSubjects.length);

      blueprint = examSubjects.map((subject, index) => ({
        topic: subject,
        percentage: evenPercentage + (index === 0 ? remainder : 0)
      }));
    }

    res.json(blueprint);
  } catch (error) {
    console.error("Error fetching exam blueprint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route for high-yield questions based on exam weightage
router.get("/questions/high-yield", async (req, res) => {
  try {
    const { exam, userId } = req.query;

    if (!exam) {
      return res.status(400).json({ error: "Exam parameter is required" });
    }

    // Define exam-specific subject weightages (would ideally come from a database)
    const examWeightages = {
      "USMLE Step 1": {
        "Anatomy": 25,
        "Physiology": 20,
        "Biochemistry": 20,
        "Pharmacology": 15,
        "Pathology": 20
      },
      "NEET": {
        "Physics": 30,
        "Chemistry": 35,
        "Biology": 20,
        "Zoology": 10,
        "Botany": 5
      },
      "PLAB": {
        "Clinical Medicine": 35,
        "Surgery": 25,
        "Obstetrics": 15,
        "Gynecology": 15,
        "Psychiatry": 10
      },
      "MCAT": {
        "Biology": 40,
        "Chemistry": 30,
        "Physics": 20,
        "Psychology": 10
      },
      "NCLEX": {
        "Fundamentals": 20,
        "Medical-Surgical": 40,
        "Pharmacology": 15,
        "Maternal Newborn": 15,
        "Pediatrics": 10
      },
      "COMLEX": {
        "Osteopathic Principles": 30,
        "Anatomy": 25,
        "Microbiology": 15,
        "Pathology": 15,
        "Pharmacology": 15
      }
    };

    // Get weightage for the requested exam (or default to empty if not found)
    const weightages = examWeightages[exam] || {};

    // Create response structure
    const result = {
      topics: []
    };

    // Process each subject with its weightage
    for (const [subjectName, weightage] of Object.entries(weightages)) {
      // Query to find questions for this subject
      let query = {};

      // Handle the way subjects are stored in your database
      try {
        // Try to find subject by name first
        const subjectIds = await Subject.find({ name: subjectName }).select("_id");
        if (subjectIds.length > 0) {
          query.subject = { $in: subjectIds.map(sub => sub._id) };
        } else {
          // Fallback to subject name if no IDs found
          query.subject = subjectName;
        }

        // Get a sample of questions for this subject (max 3 per subject)
        const questions = await Question.find(query).limit(3);

        // Add to response if questions found
        if (questions.length > 0) {
          result.topics.push({
            topicName: subjectName,
            weightage: weightage,
            questions: questions
          });
        }
      } catch (subjectError) {
        console.error(`Error finding questions for subject ${subjectName}:`, subjectError);
        // Continue with next subject even if one fails
      }
    }

    // Sort topics by weightage (descending)
    result.topics.sort((a, b) => b.weightage - a.weightage);

    res.json(result);
  } catch (error) {
    console.error("Error in high-yield questions route:", error);
    res.status(500).json({ error: error.message });
  }
});
// Add this route to your Express app to enable fetching all subjects

router.get("/subjects", async (req, res) => {
  try {
    // Fetch all subjects with their counts
    const subjects = await Subject.find({});

    // Return the full subject list
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/take-test/questions-fixed", async (req, res) => {
  try {
    const { subjects, subsections, count } = req.query;
    const query = {};

    if (subjects) {
      const subjectNames = subjects.split(",");
      const subjectIds = await Subject.find({ name: { $in: subjectNames } }).select("_id");
      query.subject = { $in: subjectIds.map(sub => sub._id) };
    }

    if (subsections) {
      query.subsection = { $in: subsections.split(",") };
    }

    const questions = await Question.find(query).limit(Number.parseInt(count));
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// smart stude calender new additions 



// ✅ New route to GET test results
router.get("/", getTestResults);

module.exports = router; // Export using CommonJS