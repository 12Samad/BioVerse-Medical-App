const mongoose = require("mongoose")

const subsectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    count: { type: Number, default: 0 }, // Number of questions in this subsection
})

// // Method to update question count
// subsectionSchema.methods.updateQuestionCount = async function () {
//     const Question = mongoose.model("Question")
//     const count = await Question.countDocuments({ subSection: this._id })
//     this.count = count
//     await this.save()

//     // Update parent subject's total count
//     const Subject = mongoose.model("Subject")
//     const subject = await Subject.findById(this.subject)
//     if (subject) {
//         await subject.updateTotalCount()
//     }
// }

module.exports = mongoose.model("Subsection", subsectionSchema)