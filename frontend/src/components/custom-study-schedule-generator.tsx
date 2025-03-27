"use client"

import axios from 'axios';
import { AlertTriangle, BookOpen, Brain, Calendar, ChevronDown, ChevronUp, Clock, Download } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Types
interface StudyScheduleProps {
  selectedExam: string;
  examDate: string;
  userId: string;
}

interface Test {
  _id?: string;
  subjectName: string;
  testTopic: string;
  date: string;
  color: string;
  completed?: boolean;
}

interface SubjectProficiency {
  subject: string;
  totalTests: number;
  completedTests: number;
  proficiencyScore: number; // 0-100
}

interface ExamBlueprint {
  topic: string;
  percentage: number;
}

interface StudyDay {
  day: number;
  date: string;
  subjects: StudySubject[];
}

interface StudySubject {
  subject: string;
  hours: number;
  priority: number; // Higher number = higher priority
  color: string;
}

const CustomStudyScheduleGenerator: React.FC<StudyScheduleProps> = ({ selectedExam, examDate, userId }) => {
  // State variables
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [proficiencyData, setProficiencyData] = useState<SubjectProficiency[]>([]);
  const [examBlueprint, setExamBlueprint] = useState<ExamBlueprint[]>([]);
  const [studySchedule, setStudySchedule] = useState<StudyDay[]>([]);
  const [daysUntilExam, setDaysUntilExam] = useState<number>(0);
  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(false);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState<number>(3);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate days until exam whenever examDate changes
  useEffect(() => {
    if (!examDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(examDate);
    targetDate.setHours(0, 0, 0, 0);

    const timeDiff = targetDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    setDaysUntilExam(daysDiff > 0 ? daysDiff : 0);
  }, [examDate]);

  // Fetch user's test data
  useEffect(() => {
    if (!userId) return;

    const fetchTests = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/calender/${userId}`);
        if (Array.isArray(response.data)) {
          setTests(response.data);
        }
      } catch (error) {
        console.error("Error fetching tests:", error);
        setError("Failed to fetch your test data. Please try again later.");
        toast.error("Failed to fetch test data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [userId]);

  // Fetch exam blueprint whenever selectedExam changes
  useEffect(() => {
    if (!selectedExam) return;

    const fetchExamBlueprint = async () => {
      setIsLoading(true);
      try {
        // Try fetching from blueprint endpoint
        try {
          const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/exams/blueprint/${selectedExam}`);
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            setExamBlueprint(response.data);
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          console.log("Blueprint API error, generating blueprint from subjects:", apiError);
          // If endpoint fails, get subjects from the mapping used in the backend
          const examSubjects = getExamSubjects(selectedExam);

          // Create a blueprint with even distribution as fallback
          if (examSubjects && examSubjects.length > 0) {
            const evenPercentage = Math.floor(100 / examSubjects.length);
            const remainder = 100 - (evenPercentage * examSubjects.length);

            const blueprint = examSubjects.map((subject, index) => ({
              topic: subject,
              percentage: evenPercentage + (index === 0 ? remainder : 0)
            }));

            setExamBlueprint(blueprint);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching exam blueprint:", error);
        setError("Failed to fetch exam blueprint. Using default distribution.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamBlueprint();
  }, [selectedExam]);

  // Helper function to get exam subjects (matches the mapping used in your backend)
  const getExamSubjects = (exam: string): string[] => {
    // This mapping should match the one in your backend
    const examSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"],
      "NEET": ["Physics", "Chemistry", "Biology", "Zoology", "Botany"],
      "PLAB": ["Clinical Medicine", "Surgery", "Obstetrics", "Gynecology", "Psychiatry"],
      "MCAT": ["Biology", "Chemistry", "Physics", "Psychology"],
      "NCLEX": ["Fundamentals", "Medical-Surgical", "Pharmacology", "Maternal Newborn", "Pediatrics"],
      "COMLEX": ["Osteopathic Principles", "Anatomy", "Microbiology", "Pathology", "Pharmacology"]
    };

    return examSubjectsMap[exam] || [];
  };

  // Calculate proficiency based on tests data
  useEffect(() => {
    if (!tests.length || !examBlueprint.length) return;

    // Group tests by subject
    const subjectGroups: Record<string, Test[]> = {};

    tests.forEach(test => {
      const subject = test.subjectName;
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(test);
    });

    // Calculate proficiency for each subject
    const proficiencyResults: SubjectProficiency[] = Object.entries(subjectGroups).map(([subject, subjectTests]) => {
      const totalTests = subjectTests.length;
      const completedTests = subjectTests.filter(test => test.completed).length;

      // Simple proficiency score: (completed / total) * 100, with a minimum of 10
      const proficiencyScore = totalTests > 0
        ? Math.max(10, Math.round((completedTests / totalTests) * 100))
        : 10; // Minimum 10% proficiency

      return {
        subject,
        totalTests,
        completedTests,
        proficiencyScore
      };
    });

    // Add subjects from blueprint that don't have any tests
    examBlueprint.forEach(item => {
      const existingSubject = proficiencyResults.find(
        p => p.subject.toLowerCase() === item.topic.toLowerCase()
      );

      if (!existingSubject) {
        proficiencyResults.push({
          subject: item.topic,
          totalTests: 0,
          completedTests: 0,
          proficiencyScore: 10 // Minimum 10% proficiency
        });
      }
    });

    setProficiencyData(proficiencyResults);
  }, [tests, examBlueprint]);

  // Generate study schedule
  const generateStudySchedule = () => {
    setIsGenerating(true);

    try {
      if (!examDate || !selectedExam || daysUntilExam <= 0) {
        toast.error("Please select a valid exam date in the future");
        setIsGenerating(false);
        return;
      }

      if (examBlueprint.length === 0) {
        toast.error("Exam blueprint data is not available");
        setIsGenerating(false);
        return;
      }

      if (proficiencyData.length === 0) {
        toast.error("Proficiency data is not available");
        setIsGenerating(false);
        return;
      }

      // Calculate priorities based on blueprint percentage and inverse of proficiency
      const subjectsWithPriority = examBlueprint.map(blueprint => {
        // Find matching proficiency data
        const proficiency = proficiencyData.find(
          p => p.subject.toLowerCase() === blueprint.topic.toLowerCase()
        ) || {
          subject: blueprint.topic,
          proficiencyScore: 10,
          totalTests: 0,
          completedTests: 0
        };

        // Priority formula: blueprint percentage * (100 - proficiency) / 100
        // This gives higher priority to high-weight, low-proficiency subjects
        const priority = Math.round((blueprint.percentage * (100 - proficiency.proficiencyScore)) / 100);

        return {
          subject: blueprint.topic,
          priority,
          blueprintPercentage: blueprint.percentage,
          proficiencyScore: proficiency.proficiencyScore
        };
      });

      // Sort subjects by priority (highest first)
      subjectsWithPriority.sort((a, b) => b.priority - a.priority);

      // Calculate total priority points
      const totalPriority = subjectsWithPriority.reduce((sum, item) => sum + item.priority, 0);

      // Allocate study time based on priority
      const subjectHours = subjectsWithPriority.map(item => {
        // Hours allocation formula: priority / totalPriority * totalStudyHours
        // Where totalStudyHours = daysUntilExam * studyHoursPerDay
        const totalStudyHours = daysUntilExam * studyHoursPerDay;
        const hours = Math.max(1, Math.round((item.priority / totalPriority) * totalStudyHours));

        return {
          subject: item.subject,
          totalHours: hours,
          priority: item.priority,
          proficiencyScore: item.proficiencyScore
        };
      });

      // Generate daily schedule
      const schedule: StudyDay[] = [];
      const today = new Date();

      for (let day = 0; day < daysUntilExam; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);

        // Initialize empty day
        schedule.push({
          day: day + 1,
          date: currentDate.toISOString().split('T')[0],
          subjects: []
        });
      }

      // Distribute subjects across days
      subjectHours.forEach(item => {
        let remainingHours = item.totalHours;
        let dayIndex = 0;

        // Get a color for this subject
        const color = getSubjectColor(item.subject);

        // Distribute hours evenly across days until we've allocated all hours
        while (remainingHours > 0 && dayIndex < schedule.length) {
          // How many hours to allocate today (1 or 2 typically)
          const hoursToday = Math.min(remainingHours, 2);

          schedule[dayIndex].subjects.push({
            subject: item.subject,
            hours: hoursToday,
            priority: item.priority,
            color
          });

          remainingHours -= hoursToday;
          dayIndex++;

          // If we've gone through all days, start again from the beginning
          if (dayIndex >= schedule.length && remainingHours > 0) {
            dayIndex = 0;
          }
        }
      });

      // Sort each day's subjects by priority
      schedule.forEach(day => {
        day.subjects.sort((a, b) => b.priority - a.priority);
      });

      setStudySchedule(schedule);
      toast.success("Study schedule generated successfully!");
    } catch (error) {
      console.error("Error generating study schedule:", error);
      toast.error("Failed to generate study schedule. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to get color for a subject
  const getSubjectColor = (subject: string): string => {
    // Try to use the existing color from tests first
    const existingTest = tests.find(test =>
      test.subjectName.toLowerCase() === subject.toLowerCase()
    );

    if (existingTest && existingTest.color) {
      return existingTest.color;
    }

    // Otherwise generate a color based on subject name
    const colors = [
      "#4299E1", // blue-500
      "#48BB78", // green-500
      "#F6AD55", // orange-400
      "#F56565", // red-500
      "#9F7AEA", // purple-500
      "#38B2AC", // teal-500
      "#68D391", // green-400
      "#FC8181", // red-400
      "#4FD1C5", // teal-400
      "#B794F4", // purple-400
      "#CBD5E0"  // gray-400 (default)
    ];

    // Simple hash function for consistent color assignment
    const hash = subject.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
  };

  // Function to download schedule as CSV
  const downloadSchedule = () => {
    if (!studySchedule.length) return;

    let csvContent = "Day,Date,Subject,Hours\n";

    studySchedule.forEach(day => {
      day.subjects.forEach(subject => {
        csvContent += `${day.day},${day.date},${subject.subject},${subject.hours}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedExam}_Study_Schedule.csv`);
    link.click();
  };

  // Format date as MM/DD/YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (!userId || !selectedExam) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center">
          <Calendar className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Custom Study Schedule Generator</h2>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-center">
          <AlertTriangle className="text-yellow-500 mr-2" />
          <p>Please select an exam and set an exam date to generate a study schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Custom Study Schedule Generator</h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
          aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {!isExpanded ? (
        <div className="text-center py-4 text-gray-500">
          Click to expand and generate a personalized study schedule.
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              <p>{error}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="bg-blue-50 rounded-md p-3 flex-1">
                <div className="text-sm text-blue-700">Selected Exam</div>
                <div className="font-semibold">{selectedExam}</div>
              </div>

              <div className="bg-green-50 rounded-md p-3 flex-1">
                <div className="text-sm text-green-700">Exam Date</div>
                <div className="font-semibold">{examDate ? new Date(examDate).toLocaleDateString() : "Not set"}</div>
              </div>

              <div className="bg-orange-50 rounded-md p-3 flex-1">
                <div className="text-sm text-orange-700">Days Remaining</div>
                <div className="font-semibold">{daysUntilExam > 0 ? daysUntilExam : "Exam date has passed"}</div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="studyHoursPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                Study Hours Per Day
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  id="studyHoursPerDay"
                  min="1"
                  max="8"
                  value={studyHoursPerDay}
                  onChange={(e) => setStudyHoursPerDay(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-2 min-w-[30px] text-center">{studyHoursPerDay}h</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={generateStudySchedule}
                disabled={isGenerating || isLoading || daysUntilExam <= 0 || !examDate}
                className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 ${isGenerating || isLoading || daysUntilExam <= 0 || !examDate
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
              >
                <BookOpen size={18} />
                {isGenerating ? "Generating..." : "Generate Study Schedule"}
              </button>

              {studySchedule.length > 0 && (
                <button
                  onClick={downloadSchedule}
                  className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <Download size={18} />
                  Download
                </button>
              )}
            </div>
          </div>

          {studySchedule.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Brain /> Your Personalized {selectedExam} Study Plan
              </h3>

              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  This schedule prioritizes subjects with high exam weight and lower proficiency.
                  Study sessions are distributed across {daysUntilExam} days until your exam.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                {/* Show first week or all days based on toggle */}
                {studySchedule.slice(0, showFullSchedule ? undefined : 7).map((day, index) => (
                  <div
                    key={index}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } p-3 border-b last:border-b-0`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">
                        Day {day.day} • {formatDate(day.date)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock size={14} className="mr-1" />
                        {day.subjects.reduce((sum, subject) => sum + subject.hours, 0)} hours
                      </div>
                    </div>

                    <div className="space-y-2">
                      {day.subjects.map((subject, sIndex) => (
                        <div
                          key={sIndex}
                          className="flex items-center rounded-md p-2"
                          style={{ backgroundColor: `${subject.color}20` }} // 20 = 12% opacity
                        >
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: subject.color }}
                          ></div>
                          <div className="flex-1">
                            <span className="font-medium">{subject.subject}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {subject.hours} {subject.hours === 1 ? "hour" : "hours"}
                          </div>
                        </div>
                      ))}

                      {day.subjects.length === 0 && (
                        <div className="text-gray-400 text-center py-1 italic">
                          No study sessions scheduled for this day
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {studySchedule.length > 7 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setShowFullSchedule(!showFullSchedule)}
                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 mx-auto"
                  >
                    {showFullSchedule ? (
                      <>
                        <ChevronUp size={16} /> Show First Week Only
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} /> Show All {studySchedule.length} Days
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Brain size={18} /> Priority Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {examBlueprint.map((item, index) => {
                    const proficiency = proficiencyData.find(
                      p => p.subject.toLowerCase() === item.topic.toLowerCase()
                    );

                    return (
                      <div
                        key={index}
                        className="border rounded-md p-3 flex justify-between"
                      >
                        <div>
                          <div className="font-medium">{item.topic}</div>
                          <div className="text-xs text-gray-500">
                            Exam: {item.percentage}% • Proficiency: {proficiency?.proficiencyScore || 0}%
                          </div>
                        </div>
                        <div className="flex items-center">
                          {/* Bar showing exam weight */}
                          <div className="w-20 h-3 bg-gray-200 rounded-full mr-1">
                            <div
                              className="h-3 bg-blue-500 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomStudyScheduleGenerator;