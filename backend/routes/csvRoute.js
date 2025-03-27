const express = require('express');
const { IncomingForm } = require('formidable');
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Question = require('../models/questionModel');
const Subject = require('../models/subjectModel');
const Subsection = require('../models/subSectionModel');

const router = express.Router();

// Validate question fields
const validateQuestion = (question) => {
    const errors = [];

    if (!question.subject) errors.push('Subject is required');
    if (!question.subsection) errors.push('Subsection is required');
    if (!question.system) errors.push('System is required');
    if (!question.topic) errors.push('Topic is required');
    if (!Array.isArray(question.subtopics) || question.subtopics.length === 0) errors.push('At least one subtopic is required');
    if (!['USMLE_STEP1', 'USMLE_STEP2', 'USMLE_STEP3'].includes(question.exam_type)) errors.push('Invalid exam type');
    if (typeof question.year !== 'number' || question.year < 1900 || question.year > new Date().getFullYear()) errors.push('Invalid year');
    if (!['easy', 'medium', 'hard'].includes(question.difficulty)) errors.push('Invalid difficulty');
    if (!question.specialty) errors.push('Specialty is required');
    if (!question.clinical_setting) errors.push('Clinical setting is required');
    if (!['case_based', 'single_best_answer', 'extended_matching'].includes(question.question_type)) errors.push('Invalid question type');
    if (!question.question) errors.push('Question text is required');
    if (!Array.isArray(question.options) || question.options.length !== 4) errors.push('Exactly 4 options are required');
    if (!question.answer || !question.options.includes(question.answer)) errors.push('Answer must be one of the options');
    if (!question.explanation) errors.push('Explanation is required');

    return errors;
};

// Process CSV file
const processCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    const formattedData = {
                        subject: data.subject?.trim() || '',
                        subsection: data.subsection?.trim() || '',
                        system: data.system?.trim() || '',
                        topic: data.topic?.trim() || '',
                        subtopics: data.subtopics ? data.subtopics.split('|').map(s => s.trim()) : [],
                        exam_type: data.exam_type?.trim() || '',
                        year: parseInt(data.year, 10),
                        difficulty: data.difficulty?.trim() || '',
                        specialty: data.specialty?.trim() || '',
                        clinical_setting: data.clinical_setting?.trim() || '',
                        question_type: data.question_type?.trim() || '',
                        question: data.question?.trim() || '',
                        options: [data.option1, data.option2, data.option3, data.option4].filter(Boolean),
                        answer: data.answer?.trim() || '',
                        explanation: data.explanation?.trim() || '',
                    };
                    results.push(formattedData);
                } catch (err) {
                    console.error('CSV Processing Error:', err);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

// Process JSON file
const processJSON = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) reject(err);
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
                } catch (error) {
                    reject(error);
                }
            }
        });
    });
};

// Upload and process questions
router.post('/', (req, res) => {
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ message: 'Error parsing form data' });
        }

        const file = files.file[0];
        if (!file || !file.originalFilename) return res.status(400).json({ error: "Invalid file upload" });

        console.log("Uploaded file:", file);
        const filePath = file.filepath;
        const fileType = file.originalFilename.split('.').pop().toLowerCase();

        let questions = [];
        try {
            if (fileType === 'csv') {
                questions = await processCSV(filePath);
            } else if (fileType === 'json') {
                questions = await processJSON(filePath);
            } else {
                return res.status(400).json({ message: 'Invalid file type. Only CSV and JSON are supported.' });
            }
        } catch (error) {
            return res.status(500).json({ message: 'Error processing file' });
        }

        const errors = [];
        const validQuestions = [];

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const validationErrors = validateQuestion(question);

            if (validationErrors.length > 0) {
                errors.push({ row: i + 1, errors: validationErrors });
            } else {
                validQuestions.push(question);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        try {
            for (const question of validQuestions) {
                let subject = await Subject.findOne({ name: question.subject });
                if (!subject) {
                    subject = new Subject({ name: question.subject, subsections: [] });
                    await subject.save();
                }

                let subsection = await Subsection.findOne({ name: question.subsection, subject: subject._id });
                if (!subsection) {
                    subsection = new Subsection({ name: question.subsection, subject: subject._id, count: 0 });
                    await subsection.save();
                    subject.subsections.push(subsection._id);
                    await subject.save();
                }

                const newQuestion = new Question({
                    ...question,
                    subject: subject._id,
                    subsection: subsection._id,
                });
                await newQuestion.save();

                // Update the count in subsection
                subsection.count = await Question.countDocuments({ subsection: subsection._id });
                await subsection.save();

                // Update the count in subject
                const allSubsections = await Subsection.find({ subject: subject._id });
                subject.count = allSubsections.reduce((sum, sec) => sum + sec.count, 0);
                await subject.save();
            }

            res.status(200).json({ message: 'Questions uploaded successfully' });
        } catch (error) {
            console.error('Error saving questions:', error);
            res.status(500).json({ message: 'Error saving questions to database' });
        }
    });
});

module.exports = router;
