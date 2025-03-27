const Subject = require("../models/subjectModel")
const Subsection = require("../models/subSectionModel")

async function recalculateAllCounts() {
    // Update all subsection counts
    const subsections = await Subsection.find({})
    await Promise.all(subsections.map((subsection) => subsection.updateQuestionCount()))

    // Update all subject total counts
    const subjects = await Subject.find({})
    await Promise.all(subjects.map((subject) => subject.updateTotalCount()))
}

module.exports = {
    recalculateAllCounts,
}

