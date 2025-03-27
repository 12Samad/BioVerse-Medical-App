const mongoose = require("mongoose")

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Please provide an amount"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Please provide a currency"],
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Please provide a payment method"],
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, "Please provide a Stripe payment intent ID"],
    },
    receiptUrl: {
      type: String,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Payment", PaymentSchema)

