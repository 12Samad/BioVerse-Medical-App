const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Flashcard = require('./models/flashcardModel'); // Import the Flashcard model

// Connect to the database
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to database'))
  .catch((err) => console.log('Database connection error:', err));

// Read flashcards from the JSON file
const flashcardsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'flashcards.json'), 'utf-8'));

// Insert flashcards data into the database
const insertFlashcards = async () => {
  try {
    await Flashcard.deleteMany({}); // Optional: Clear the collection first
    await Flashcard.insertMany(flashcardsData.flashcards);
    console.log('Flashcards data inserted successfully');
    mongoose.disconnect(); // Close the database connection after the operation
  } catch (err) {
    console.error('Error inserting flashcards:', err);
    mongoose.disconnect(); // Close the database connection on error
  }
};

// Run the insert function
insertFlashcards();
