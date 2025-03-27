const mongoose = require("mongoose")

const CourseModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a module title"],
    trim: true,
  },
  lessons: {
    type: [String],
    required: [true, "Please provide at least one lesson"],
  },
})

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a course title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a course description"],
      trim: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Please provide a category"],
      enum: ["Development", "Design", "Data Science", "Business", "Marketing", "Other"],
    },
    instructor: {
      type: String,
      required: [true, "Please provide an instructor name"],
    },
    instructorBio: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: String,
      required: [true, "Please provide a duration"],
    },
    level: {
      type: String,
      required: [true, "Please provide a level"],
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating cannot be more than 5"],
    },
    enrollments: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      required: [true, "Please provide a source"],
      enum: ["internal", "udemy", "coursera", "edx"],
    },
    modules: {
      type: [CourseModuleSchema],
    },
    prerequisites: {
      type: [String],
    },
    objectives: {
      type: [String],
      required: [true, "Please provide at least one learning objective"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
)

// Add index for search
CourseSchema.index({ title: "text", description: "text", category: "text", instructor: "text" })

module.exports = mongoose.model("Course", CourseSchema)

