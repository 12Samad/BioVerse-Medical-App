import apiService from "./api-service"

// Define the MissedQuestion interface
export interface MissedQuestion {
  id: string
  question: string
  correctAnswer: string
  explanation: string
  subject: string
  topic: string
  difficulty: string
  userAnswer?: string
  testId: string
  testDate: string
}

// Mock data for development/testing
const MOCK_MISSED_QUESTIONS: MissedQuestion[] = [
  {
    id: "q1",
    question:
      "A 45-year-old male presents with chest pain radiating to the left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?",
    correctAnswer: "Inferior wall myocardial infarction",
    explanation:
      "ST elevation in leads II, III, and aVF is characteristic of inferior wall MI. The right coronary artery typically supplies this region.",
    subject: "Cardiovascular",
    topic: "Myocardial Infarction",
    difficulty: "medium",
    userAnswer: "Anterior wall myocardial infarction",
    testId: "test123",
    testDate: "2023-10-15",
  },
  {
    id: "q2",
    question: "Which enzyme is responsible for converting angiotensin I to angiotensin II?",
    correctAnswer: "Angiotensin-converting enzyme (ACE)",
    explanation:
      "ACE is a key enzyme in the renin-angiotensin-aldosterone system. It converts angiotensin I to the active vasoconstrictor angiotensin II.",
    subject: "Biochemistry",
    topic: "Enzymes",
    difficulty: "easy",
    userAnswer: "Renin",
    testId: "test123",
    testDate: "2023-10-15",
  },
  {
    id: "q3",
    question:
      "A patient presents with fever, productive cough, and consolidation on chest X-ray. Gram stain of sputum shows gram-positive diplococci. What is the most likely causative organism?",
    correctAnswer: "Streptococcus pneumoniae",
    explanation:
      "S. pneumoniae is the most common cause of community-acquired pneumonia. It appears as gram-positive diplococci on Gram stain and typically causes lobar pneumonia with consolidation.",
    subject: "Microbiology",
    topic: "Bacterial Infections",
    difficulty: "medium",
    testId: "test123",
    testDate: "2023-10-15",
  },
  {
    id: "q4",
    question:
      "A 60-year-old patient with a history of smoking presents with weight loss, hemoptysis, and a hilar mass on chest X-ray. Which cancer is most likely?",
    correctAnswer: "Small cell lung carcinoma",
    explanation:
      "Small cell lung carcinoma is strongly associated with smoking and typically presents as a hilar or perihilar mass. It often presents with paraneoplastic syndromes and metastasizes early.",
    subject: "Pathology",
    topic: "Oncology",
    difficulty: "hard",
    userAnswer: "Adenocarcinoma of the lung",
    testId: "test124",
    testDate: "2023-11-02",
  },
  {
    id: "q5",
    question:
      "Which of the following antibiotics inhibits bacterial protein synthesis by binding to the 50S ribosomal subunit?",
    correctAnswer: "Chloramphenicol",
    explanation:
      "Chloramphenicol binds to the 50S ribosomal subunit and inhibits peptidyl transferase activity, preventing peptide bond formation. This is a high-yield topic for pharmacology.",
    subject: "Pharmacology",
    topic: "Antibiotics",
    difficulty: "medium",
    testId: "test124",
    testDate: "2023-11-02",
  },
]

// Create a separate service for missed questions
const missedQuestionsService = {
  // Get missed questions for a user
  getMissedQuestions: async (userId: string) => {
    try {
      // In a real implementation, you would call your API here using the userId
      // For now, we'll use mock data

      // Log the userId to satisfy the linter
      console.log(`Fetching missed questions for user: ${userId}`)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Return mock data
      return {
        data: MOCK_MISSED_QUESTIONS,
        status: 200,
        statusText: "OK",
      }

      // When your API endpoint is ready, you can replace the above with:
      // return await fetch(`/api/tests/missed-questions?userId=${_userId}`).then(res => res.json());
    } catch (error) {
      console.error("Error fetching missed questions:", error)
      apiService.handleApiError(error, "Failed to load missed questions")

      // Return empty array on error
      return { data: [], status: 500, statusText: "Error" }
    }
  },
}

export default missedQuestionsService

