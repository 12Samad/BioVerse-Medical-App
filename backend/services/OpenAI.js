// services/openAiService.js
const { OpenAI } = require('openai');

// Initialize OpenAI client (API key should be in environment variables)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Simple service to generate study plans using OpenAI
 */
const openAiService = {
    /**
     * Generate a study plan based on user input
     * @param {Object} userData - User input from the form
     * @returns {Promise<Object>} - Generated study plan
     */
    generateStudyPlan: async (userData) => {
        try {
            // Calculate study duration if exam date is provided
            let studyDuration = "12 weeks"; // Default duration
            let weeksUntilExam = 12;

            if (userData.examDate) {
                const now = new Date();
                const examDate = new Date(userData.examDate);
                const diffTime = Math.abs(examDate - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                weeksUntilExam = Math.ceil(diffDays / 7);
                studyDuration = `${weeksUntilExam} weeks`;
            }

            // Get exam-specific resources based on selected exam
            const examResources = getExamSpecificResources(userData.targetExam);

            // Construct the prompt for OpenAI
            const prompt = {
                model: "gpt-4o-mini", // Use the most capable model for detailed plans
                messages: [
                    {
                        role: "system",
                        content: `You are an expert medical education advisor specialized in creating personalized study plans. 
            Create a detailed, practical study plan for a medical student preparing for their exam.
            The plan should include daily and weekly schedules, specific resources, and study techniques.
            Adapt to their target exam, knowledge level, available study time, and learning preferences.
            Be very specific about resource recommendations - include actual titles of books, question banks, and video resources that are well-known and highly regarded for this exam.
            Format your response in JSON following the structure in the user's message.`
                    },
                    {
                        role: "user",
                        content: `Create a personalized study plan with the following information:
            
            - Name: ${userData.name || 'Student'}
            - Current knowledge level: ${userData.currentLevel || 'intermediate'}
            - Target exam: ${userData.targetExam}
            - Study duration: ${studyDuration}
            ${userData.examDate ? `- Exam date: ${userData.examDate}` : ''}
            ${userData.targetScore ? `- Target score: ${userData.targetScore}` : ''}
            - Strong subjects: ${(userData.strongSubjects || []).join(', ')}
            - Weak subjects: ${(userData.weakSubjects || []).join(', ')}
            - Available hours per day: ${userData.availableHours || 2}
            - Days per week: ${userData.daysPerWeek || 5}
            - Preferred time of day: ${userData.preferredTimeOfDay || 'flexible'}
            - Learning style: ${userData.preferredLearningStyle || 'mixed'}
            ${userData.previousScores ? `- Previous scores: ${userData.previousScores}` : ''}
            ${userData.specificGoals ? `- Specific goals: ${userData.specificGoals}` : ''}
            ${userData.additionalInfo ? `- Additional info: ${userData.additionalInfo}` : ''}
            
            Please provide the plan in JSON format with the following structure:
            {
              "title": "Comprehensive 12-Week USMLE Step 1 Study Plan",
              "overview": "This personalized study plan focuses on strengthening your weak areas while maintaining your strong subjects. It incorporates your visual learning style with a balanced mix of resources.",
              "examInfo": {
                "exam": "USMLE Step 1",
                "targetDate": "2023-06-15",
                "targetScore": "240+"
              },
              "weeklyPlans": [
                {
                  "weekNumber": 1,
                  "theme": "Foundations of Biochemistry and Cell Biology",
                  "focusAreas": ["Biochemistry", "Cell Biology", "Molecular Biology"],
                  "weeklyGoals": [
                    {
                      "subject": "Biochemistry",
                      "description": "Master metabolism pathways and enzyme kinetics"
                    },
                    {
                      "subject": "Cell Biology",
                      "description": "Complete cell cycle and signaling pathways"
                    }
                  ],
                  "days": [
                    {
                      "dayOfWeek": "Monday",
                      "focusAreas": ["Metabolism", "Glycolysis"],
                      "tasks": [
                        {
                          "subject": "Biochemistry",
                          "duration": 120,
                          "activity": "Study glycolysis and TCA cycle using First Aid and Boards & Beyond videos",
                          "resources": [
                            {
                              "name": "First Aid 2023",
                              "type": "book",
                              "description": "Pages 74-89: Metabolism section"
                            },
                            {
                              "name": "Boards & Beyond - Biochemistry",
                              "type": "video",
                              "description": "Glycolysis and TCA cycle videos (60 min total)"
                            }
                          ]
                        },
                        {
                          "subject": "Biochemistry",
                          "duration": 60,
                          "activity": "Complete 40 UWorld questions on metabolism",
                          "resources": [
                            {
                              "name": "UWorld Qbank",
                              "type": "question bank",
                              "description": "Biochemistry section - Metabolism questions"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              "resources": {
                "books": [
                  {
                    "title": "First Aid for the USMLE Step 1 2023",
                    "author": "Tao Le, Vikas Bhushan",
                    "description": "The gold standard review book for Step 1",
                    "relevantTopics": ["Comprehensive review", "High-yield facts"]
                  },
                  {
                    "title": "Pathoma: Fundamentals of Pathology",
                    "author": "Dr. Husain Sattar",
                    "description": "Excellent pathology review with accompanying videos",
                    "relevantTopics": ["Pathology", "Disease mechanisms"]
                  }
                ],
                "videos": [
                  {
                    "title": "Boards and Beyond",
                    "platform": "boardsandbeyond.com",
                    "description": "Comprehensive video series covering all USMLE topics",
                    "relevantTopics": ["All subjects", "Integrated learning"]
                  },
                  {
                    "title": "Sketchy Medical",
                    "platform": "sketchymedical.com",
                    "description": "Visual mnemonic videos for microbiology, pharmacology and pathology",
                    "relevantTopics": ["Microbiology", "Pharmacology", "Visual learning"]
                  }
                ],
                "questionBanks": [
                  {
                    "title": "UWorld Step 1 Qbank",
                    "description": "Gold standard question bank with detailed explanations",
                    "relevantTopics": ["All subjects", "Test-like questions"]
                  },
                  {
                    "title": "AMBOSS Qbank",
                    "description": "Challenging questions with integrated learning library",
                    "relevantTopics": ["All subjects", "Advanced concepts"]
                  }
                ]
              },
              "studyTips": [
                {
                  "title": "Spaced Repetition",
                  "description": "Use Anki flashcards to review high-yield facts daily, especially for weak subjects"
                },
                {
                  "title": "Active Recall",
                  "description": "After learning a concept, close your resources and try to teach it back to yourself"
                },
                {
                  "title": "Question-Based Learning",
                  "description": "Do at least 40 practice questions daily and thoroughly review all explanations, even for questions you got right"
                }
              ]
            }
            
            Create a plan covering ${weeksUntilExam} weeks with detailed daily schedules for each day the user plans to study.
            Focus more on their weak subjects while maintaining strong ones.
            Recommend specific high-yield resources appropriate for ${userData.targetExam}.
            Include varied activities based on their ${userData.preferredLearningStyle} learning style.
            Ensure the plan accounts for their ${userData.availableHours} hours daily across ${userData.daysPerWeek} days per week.
            Provide at least 5 specific study tips tailored to their exam and preferences.
            
            For resources, include these well-known materials for ${userData.targetExam}:
            ${examResources.books.map(book => `- Book: "${book.title}" by ${book.author}`).join('\n')}
            ${examResources.videos.map(video => `- Video: "${video.title}" on ${video.platform}`).join('\n')}
            ${examResources.questionBanks.map(qbank => `- Question Bank: "${qbank.title}"`).join('\n')}
            
            Make sure all recommendations are specific, naming actual resources that exist and are considered high-quality for ${userData.targetExam}.`
                    }
                ],
                response_format: { type: "json_object" }
            };

            // Call OpenAI API
            const response = await openai.chat.completions.create(prompt);

            // Parse the generated plan
            const generatedPlan = JSON.parse(response.choices[0].message.content);

            // Add metadata and return
            return {
                plan: generatedPlan,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    model: "gpt-4o-mini",
                    examName: userData.targetExam,
                    duration: studyDuration
                }
            };
        } catch (error) {
            console.error('Error generating study plan:', error);
            throw new Error('Failed to generate study plan: ' + error.message);
        }
    }
};

/**
 * Get exam-specific resource recommendations
 * @param {string} examName - The name of the target exam
 * @returns {Object} - Recommended resources for the exam
 */
function getExamSpecificResources(examName) {
    // Default resources if no match is found
    const defaultResources = {
        books: [
            { title: "Medical Review Book", author: "Various Authors" },
            { title: "Clinical Medicine Guide", author: "Medical Education Group" }
        ],
        videos: [
            { title: "Medical Review Videos", platform: "MedEd Platform" },
            { title: "Clinical Skills Series", platform: "Healthcare Learning" }
        ],
        questionBanks: [
            { title: "Medical Exam Qbank", description: "Comprehensive question bank" },
            { title: "Clinical Practice Questions", description: "Case-based scenarios" }
        ]
    };

    // Exam-specific resources
    const examResources = {
        "USMLE Step 1": {
            books: [
                { title: "First Aid for the USMLE Step 1 2023", author: "Tao Le and Vikas Bhushan" },
                { title: "Pathoma: Fundamentals of Pathology", author: "Dr. Husain Sattar" },
                { title: "Physiology (BRS Board Review Series)", author: "Linda S. Costanzo" }
            ],
            videos: [
                { title: "Boards and Beyond", platform: "boardsandbeyond.com" },
                { title: "Sketchy Medical", platform: "sketchymedical.com" },
                { title: "Pathoma", platform: "pathoma.com" }
            ],
            questionBanks: [
                { title: "UWorld Step 1 Qbank", description: "Gold standard question bank" },
                { title: "AMBOSS Qbank", description: "Detailed explanations with library" },
                { title: "NBME Self-Assessments", description: "Official practice exams" }
            ]
        },
        "USMLE Step 2": {
            books: [
                { title: "First Aid for the USMLE Step 2 CK", author: "Tao Le and Vikas Bhushan" },
                { title: "Master the Boards USMLE Step 2 CK", author: "Conrad Fischer" },
                { title: "Step-Up to Medicine", author: "Steven Agabegi and Elizabeth Agabegi" }
            ],
            videos: [
                { title: "OME (OnlineMedEd)", platform: "onlinemeded.org" },
                { title: "Boards and Beyond Step 2/3", platform: "boardsandbeyond.com" },
                { title: "Divine Intervention", platform: "divineinterventionpodcasts.com" }
            ],
            questionBanks: [
                { title: "UWorld Step 2 CK Qbank", description: "Gold standard question bank" },
                { title: "AMBOSS Step 2 Qbank", description: "Detailed explanations with library" },
                { title: "NBME Clinical Mastery Series", description: "Official practice exams" }
            ]
        },
        "MCAT": {
            books: [
                { title: "MCAT Complete 7-Book Subject Review", author: "Kaplan Test Prep" },
                { title: "The Princeton Review MCAT Subject Review", author: "Princeton Review" },
                { title: "MCAT Prep Books by ExamKrackers", author: "Jonathan Orsay" }
            ],
            videos: [
                { title: "Khan Academy MCAT Collection", platform: "khanacademy.org" },
                { title: "MedSchoolCoach MCAT Videos", platform: "medschoolcoach.com" },
                { title: "The MCAT Podcast", platform: "medicalschoolhq.net" }
            ],
            questionBanks: [
                { title: "AAMC Official MCAT Practice Exams", description: "Official practice exams" },
                { title: "UWorld MCAT Qbank", description: "Detailed explanations" },
                { title: "Next Step/Blueprint MCAT Practice Exams", description: "Full-length practice tests" }
            ]
        },
        "PLAB": {
            books: [
                { title: "Get Through PLAB: 500 Single Best Answer Questions", author: "Una Coales" },
                { title: "PLAB 1: 1000 Extended Matching Questions", author: "Una Coales" },
                { title: "Essential Revision Notes for PLAB 1", author: "Khalid Saifullah" }
            ],
            videos: [
                { title: "PLAB Made Easy", platform: "plabmadeeasy.com" },
                { title: "Samson PLAB Academy", platform: "samsonplab.co.uk" },
                { title: "PLAB Doctor", platform: "plabdoctor.com" }
            ],
            questionBanks: [
                { title: "PLABABLE Question Bank", description: "Practice questions with explanations" },
                { title: "PLAB 1 Revision", description: "Mock exams and SBAs" },
                { title: "GMC Sample Questions", description: "Official sample questions" }
            ]
        },
        "NEET": {
            books: [
                { title: "NCERT Biology Class 11 & 12", author: "NCERT" },
                { title: "Objective NCERT at your Fingertips - Biology", author: "MTG Editorial Board" },
                { title: "Objective Biology for NEET", author: "Dinesh" }
            ],
            videos: [
                { title: "NEET Biology by Unacademy", platform: "unacademy.com" },
                { title: "NEET Preparation by Aakash Digital", platform: "aakash.ac.in" },
                { title: "Vedantu NEET Made Ejee", platform: "vedantu.com" }
            ],
            questionBanks: [
                { title: "MTG 32 Years NEET Chapter-wise Solutions", description: "Previous year questions" },
                { title: "Aakash Test Series", description: "Full-length practice tests" },
                { title: "Allen Test Series", description: "Mock exams and practice questions" }
            ]
        },
        "NCLEX": {
            books: [
                { title: "Saunders Comprehensive Review for the NCLEX-RN", author: "Linda Anne Silvestri" },
                { title: "NCLEX-RN Prep Plus", author: "Kaplan Nursing" },
                { title: "Prioritization, Delegation, and Assignment", author: "Linda A. LaCharity" }
            ],
            videos: [
                { title: "Simple Nursing", platform: "simplenursing.com" },
                { title: "RegisteredNurseRN", platform: "youtube.com/c/RegisteredNurseRN" },
                { title: "NCLEX Crusade", platform: "nclexcrusade.com" }
            ],
            questionBanks: [
                { title: "UWorld NCLEX", description: "Comprehensive question bank" },
                { title: "Kaplan NCLEX Qbank", description: "Detailed rationales" },
                { title: "NCSBN Learning Extension", description: "Official review course" }
            ]
        }
    };

    // Return resources for the specified exam, or default if not found
    return examResources[examName] || defaultResources;
}

module.exports = openAiService;