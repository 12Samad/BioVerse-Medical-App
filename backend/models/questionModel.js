const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  subsection: { type: mongoose.Schema.Types.ObjectId, ref: "Subsection", required: true },
  system: { type: String, required: true },
  topic: { type: String, required: true },
  subtopics: { type: [String], required: true },
  exam_type: { type: String, required: true, enum: ["USMLE_STEP1", "USMLE_STEP2", "USMLE_STEP3"] },
  year: { type: Number, required: true },
  difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"] },
  specialty: { type: String, required: true },
  state_specific: { type: String },
  clinical_setting: { type: String, required: true },
  question_type: { type: String, required: true, enum: ["case_based", "single_best_answer", "extended_matching"] },
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (val) => val.length === 4,
      message: "Options must have exactly 4 elements",
    },
  },
  answer: { type: String, required: true },
  explanation: { type: String, required: true },
});

/**
 * Updates the question count for the subsection
 */
questionSchema.methods.updateSubsectionCount = async function () {
  const Question = mongoose.model("Question");
  const Subsection = mongoose.model("Subsection");

  // console.log("🔄 Updating subsection count for:", this.subsection);

  // Count total questions in this subsection
  const count = await Question.countDocuments({ subsection: this.subsection });

  // console.log(`✅ Found ${count} questions in subsection:`, this.subsection);

  // Update subsection's count
  await Subsection.findByIdAndUpdate(this.subsection, { count });

  // console.log("✅ Subsection count updated successfully!");

  // Now update the subject count
  await this.updateSubjectCount();
};

/**
 * Updates the question count for the subject (sum of all its subsection counts)
 */
questionSchema.methods.updateSubjectCount = async function () {
  const Subsection = mongoose.model("Subsection");
  const Subject = mongoose.model("Subject");

  // console.log("🔄 Updating subject count for:", this.subject);

  // Get all subsections belonging to this subject
  const subsections = await Subsection.find({ subject: this.subject });

  // Sum up all question counts from subsections
  const totalQuestionCount = subsections.reduce((acc, sub) => acc + (sub.count || 0), 0);

  // console.log(`✅ Calculated total question count for subject: ${this.subject} → ${totalQuestionCount}`);

  // Update subject's total count
  await Subject.findByIdAndUpdate(this.subject, { count: totalQuestionCount });

  // console.log("✅ Subject count updated successfully!");
};

// Middleware to update counts after saving a question
questionSchema.post("save", async function () {
  // console.log("📌 Question Saved - Updating Counts...");
  await this.updateSubsectionCount();
});

// Middleware to update counts after deleting a question
questionSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    // console.log("❌ Question Deleted - Updating Counts...");
    await doc.updateSubsectionCount();
  }
});

// Middleware to update counts when a question is updated
questionSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    // console.log("✏️ Question Updated - Updating Counts...");
    await doc.updateSubsectionCount();
  }
});

module.exports = mongoose.model("Question", questionSchema);
