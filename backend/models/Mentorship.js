const mongoose = require("mongoose")

const MentorReviewSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      required: [true, "Please provide a comment"],
      trim: true,
    },
  },
  { timestamps: true },
)

const AvailabilitySlotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, "Please provide a date"],
  },
  slots: {
    type: [String],
    required: [true, "Please provide at least one time slot"],
  },
})

const MentorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: [true, "Please provide a mentor name"],
  },
  avatar: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: [true, "Please provide a title"],
  },
  company: {
    type: String,
    required: [true, "Please provide a company"],
  },
  bio: {
    type: String,
    required: [true, "Please provide a bio"],
  },
  expertise: {
    type: [String],
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, "Rating must be at least 0"],
    max: [5, "Rating cannot be more than 5"],
  },
  totalSessions: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: [MentorReviewSchema],
    default: [],
  },
})

const MentorshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a mentorship title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a mentorship description"],
      trim: true,
    },
    mentor: {
      type: MentorSchema,
      required: true,
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
    category: {
      type: String,
      required: [true, "Please provide a category"],
      enum: ["Development", "Design", "Data Science", "Product", "Business", "Marketing", "Other"],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    topics: {
      type: [String],
    },
    availability: {
      type: [AvailabilitySlotSchema],
      default: [],
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
MentorshipSchema.index({ title: "text", description: "text", category: "text", "mentor.name": "text" })

module.exports = mongoose.model("Mentorship", MentorshipSchema)

