export interface MotivationalMessage {
  id: string
  content: string
  category: string
  isCustom: boolean
  createdAt: string
}

export interface NotificationSettings {
  enabled: boolean
  frequency: "daily" | "twice-daily" | "hourly" | "event-based"
  categories: {
    daily: boolean
    achievement: boolean
    streak: boolean
    challenge: boolean
    encouragement: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  customMessages: MotivationalMessage[]
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  frequency: "daily",
  categories: {
    daily: true,
    achievement: true,
    streak: true,
    challenge: true,
    encouragement: true,
  },
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "07:00",
  },
  customMessages: [],
}

export const defaultMessages: Record<string, string[]> = {
  daily: [
    "Your dedication to medicine will change countless lives.",
    "Every step in your medical journey matters.",
    "Small daily improvements lead to remarkable results over time.",
  ],
  achievement: ["Congratulations on your achievement!", "Your hard work has paid off.", "Keep up the excellent work!"],
  streak: ["You're on a {streak} day streak!", "Keep the momentum going!", "Consistency is key to success."],
  challenge: ["You got this!", "Believe in yourself.", "Every challenge is an opportunity to grow."],
  encouragement: ["Don't give up!", "You're doing great.", "Keep pushing forward."],
}

export function formatMessage(message: string, variables: Record<string, string | number>): string {
  let formattedMessage = message
  for (const key in variables) {
    formattedMessage = formattedMessage.replace(`{${key}}`, String(variables[key]))
  }
  return formattedMessage
}

export function getRandomMessage(category: "daily" | "achievement" | "streak" | "challenge" | "encouragement"): string {
  const messages = defaultMessages[category]
  const randomIndex = Math.floor(Math.random() * messages.length)
  return messages[randomIndex]
}

// Categorized motivational messages for different page types
export const categorizedMessages = {
  // For study and learning pages
  study: [
    "Every study session brings you one step closer to mastery.",
    "The knowledge you gain today will serve your patients tomorrow.",
    "Medical knowledge is built one concept at a time.",
    "Great doctors are always great students first.",
    "Your dedication to learning will benefit countless future patients.",
    "The more you learn, the more lives you'll be able to impact.",
    "Quality study time today means better patient care tomorrow.",
    "Each concept you master is a tool in your future medical toolkit.",
    "Learning medicine is a marathon, not a sprint. Keep going!",
    "The best investment in your medical career is the time you spend studying.",
  ],

  // For performance and achievement tracking pages
  performance: [
    "Track your progress to celebrate how far you've come.",
    "Data-driven improvement is the hallmark of medical excellence.",
    "Your performance metrics are the roadmap to your growth.",
    "Measuring progress helps identify opportunities for improvement.",
    "Great doctors continuously evaluate and improve their performance.",
    "Your metrics tell a story of dedication and growth.",
    "Tracking your performance turns weaknesses into strengths.",
    "The data doesn't lie - see your improvement in real time!",
    "Celebrate your progress while planning your next achievement.",
    "Your performance journey is unique to you - embrace it!",
  ],

  // For challenge and test pages
  challenge: [
    "Challenges reveal your strengths and areas for growth.",
    "Each challenge you overcome makes you a better future doctor.",
    "Testing your knowledge reinforces your learning.",
    "Embrace challenges - they're opportunities to prove your knowledge.",
    "The best growth happens outside your comfort zone.",
    "Challenge yourself today to excel tomorrow.",
    "Every test is a chance to discover what you know and what you need to learn.",
    "Challenges build the resilience needed in medical practice.",
    "The path to expertise is paved with challenges overcome.",
    "Tests don't just measure knowledge - they strengthen it.",
  ],

  // For productivity and time management pages
  productivity: [
    "Effective time management is a critical skill for medical professionals.",
    "Balance in study leads to balance in practice.",
    "Structured study time leads to efficient learning.",
    "The Pomodoro technique helps maintain focus while preventing burnout.",
    "Taking strategic breaks improves long-term retention.",
    "Productivity isn't about studying more - it's about studying smarter.",
    "Time management today prepares you for the demands of medical practice.",
    "A well-rested mind learns more effectively than an exhausted one.",
    "Balancing focus periods with rest optimizes your learning.",
    "Your future patients will benefit from your efficiency and focus.",
  ],

  // For support and information pages
  support: [
    "Seeking help is a sign of strength, not weakness.",
    "Great doctors know when to consult colleagues and resources.",
    "Questions lead to deeper understanding.",
    "The best medical professionals are lifelong questioners.",
    "Mentorship accelerates growth and development.",
    "Learning from others' experience is as valuable as learning from books.",
    "Building your support network now will serve you throughout your career.",
    "Collaboration is at the heart of modern medicine.",
    "Asking questions today prevents mistakes tomorrow.",
    "Your curiosity drives medical innovation and improvement.",
  ],

  // For transaction and administrative pages
  admin: [
    "Investing in your education is investing in your future.",
    "Administrative details matter in medicine - attention to detail starts now.",
    "Organization in your studies translates to organization in practice.",
    "Taking care of the details allows you to focus on what matters most.",
    "Good systems support good medicine.",
    "The business of medicine supports the practice of medicine.",
    "Attention to detail is a critical skill in both medicine and administration.",
    "Organization now leads to efficiency later.",
    "Managing the details effectively gives you more time for learning.",
    "Administrative excellence supports clinical excellence.",
  ],

  // Generic messages for any page
  generic: [
    "Your dedication to medicine will change countless lives.",
    "Every step in your medical journey matters.",
    "Small daily improvements lead to remarkable results over time.",
    "Your commitment to excellence will make you an outstanding doctor.",
    "The path to becoming a great doctor is built one study session at a time.",
    "Your persistence will pay off in your medical career.",
    "Excellence in medicine requires daily dedication.",
    "Remember why you started this journey when facing difficult concepts.",
    "Your hard work today will make you a better doctor tomorrow.",
    "The medical knowledge you build now will serve you for a lifetime.",
  ],
}

// Map page paths to message categories
export const pageCategories: Record<string, keyof typeof categorizedMessages> = {
  // Study/Learning Pages
  "/dashboard/courses": "study",
  "/dashboard/create-test": "study",
  "/dashboard/flash-cards": "study",
  "/dashboard/smart-study": "study",
  "/dashboard/take-test": "study",
  "/dashboard/test-form": "study",

  // Performance/Achievement Pages
  "/dashboard/performance-tracking": "performance",
  "/dashboard/leaderboard": "performance",
  "/dashboard/custom-weekly-goals": "performance",
  "/dashboard/digital-error-notebook": "performance",
  "/dashboard/review": "performance",

  // Challenge Pages
  "/dashboard/challenge": "challenge",
  "/dashboard/daily-challenge": "challenge",

  // Productivity Pages
  "/dashboard/pomodoro-timer": "productivity",

  // Support/Information Pages
  "/dashboard/faqs": "support",
  "/dashboard/inquiries": "support",
  "/dashboard/mentor": "support",

  // Transaction Pages
  "/dashboard/payments": "admin",
  "/dashboard/cancel": "admin",
  "/dashboard/success": "admin",
}

// Function to get the category for a given path
export function getCategoryForPath(path: string): keyof typeof categorizedMessages {
  // Check if the path exactly matches any of the keys in pageCategories
  if (pageCategories[path]) {
    return pageCategories[path]
  }

  // Check if the path starts with any of the keys in pageCategories
  // This handles nested routes like /dashboard/challenge/123
  for (const [pagePath, category] of Object.entries(pageCategories)) {
    if (path.startsWith(pagePath + "/")) {
      return category
    }
  }

  // Default to generic if no match is found
  return "generic"
}

// Function to get a random message for a specific category
export function getRandomMessageForCategory(category: keyof typeof categorizedMessages): string {
  const messages = categorizedMessages[category]
  const randomIndex = Math.floor(Math.random() * messages.length)
  return messages[randomIndex]
}

// Function to get a random message based on the current path
export function getRandomMessageForPath(path: string): string {
  const category = getCategoryForPath(path)
  return getRandomMessageForCategory(category)
}

// Icons mapped to categories for visual consistency
export const categoryIcons: Record<keyof typeof categorizedMessages, string[]> = {
  study: ["📚", "🧠", "📝", "🔍", "📖"],
  performance: ["📊", "📈", "🏆", "⭐", "🎯"],
  challenge: ["💪", "🏅", "🧩", "⚡", "🔥"],
  productivity: ["⏱️", "⌛", "🗓️", "✅", "⚙️"],
  support: ["🤝", "💬", "❓", "🔔", "📢"],
  admin: ["📋", "💼", "🔐", "📑", "🗂️"],
  generic: ["💡", "✨", "🌟", "🩺", "⚕️"],
}

// Get a random icon for a category
export function getRandomIconForCategory(category: keyof typeof categorizedMessages): string {
  const icons = categoryIcons[category]
  const randomIndex = Math.floor(Math.random() * icons.length)
  return icons[randomIndex]
}

