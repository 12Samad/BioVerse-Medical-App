const mongoose = require("mongoose");
const TestData = require("./models/testdata"); // Adjust path as needed

// Replace with your actual MongoDB connection string and database name
mongoose.connect("mongodb+srv://samad:leomessi@cluster0.mwrpshc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

async function migrateQuestionIds() {
    try {
        const docs = await TestData.find({ "questions.questionId": { $type: "string" } });
        console.log(`Found ${docs.length} documents to update.`);

        let countUpdated = 0;
        for (const doc of docs) {
            let updated = false;

            // Loop over each question in the questions array
            for (let i = 0; i < doc.questions.length; i++) {
                const q = doc.questions[i];
                if (typeof q.questionId === "string") {
                    console.log(`Document ${doc._id}: Converting questionId at index ${i} from "${q.questionId}"`);
                    try {
                        // Attempt to convert the string to an ObjectId
                        const newQuestionId = new mongoose.Types.ObjectId(q.questionId);
                        doc.questions[i].questionId = newQuestionId;
                        updated = true;
                    } catch (err) {
                        console.error(`Error converting questionId for document ${doc._id} at index ${i}: ${err.message}`);
                    }
                }
            }

            // If any conversion occurred, update the document
            if (updated) {
                const result = await TestData.updateOne(
                    { _id: doc._id },
                    { $set: { questions: doc.questions } },
                    { runValidators: false } // Skip validation so other required fields won't block the update
                );
                console.log(`Updated document ${doc._id}. Modified count: ${result.modifiedCount}`);
                countUpdated++;
            } else {
                console.log(`No conversion needed for document ${doc._id}`);
            }
        }

        console.log(`Migration complete. ${countUpdated} documents updated.`);
    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        mongoose.connection.close();
    }
}

migrateQuestionIds();
