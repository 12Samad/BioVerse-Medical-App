const mongoose = require("mongoose")

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, default: 0 }, // Total questions across all subsections
  subsections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subsection" }],
})

// // Method to update total question count
// subjectSchema.methods.updateTotalCount = async function () {
//   const Subsection = mongoose.model("Subsection")
//   const subsections = await Subsection.find({ subject: this._id })
//   this.count = subsections.reduce((total, subsection) => total + (subsection.count || 0), 0)
//   await this.save()
// }

module.exports = mongoose.model("Subject", subjectSchema)