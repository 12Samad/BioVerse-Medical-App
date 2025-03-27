"use client"

import axios from 'axios';
import {
  AlertTriangle,
  BookCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface AdaptiveStudyTrackerProps {
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

interface ExamBlueprint {
  topic: string;
  percentage: number;
}

interface SubjectProficiency {
  subject: string;
  testsTotal: number;
  testsCompleted: number;
  proficiencyScore: number;
  difficulty: 'foundation' | 'moderate' | 'advanced';
  urgency: 'low' | 'medium' | 'high';
}

const AdaptiveStudyTracker: React.FC<AdaptiveStudyTrackerProps> = ({ selectedExam, examDate, userId }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [examBlueprint, setExamBlueprint] = useState<ExamBlueprint[]>([]);
  const [subjectProficiency, setSubjectProficiency] = useState<SubjectProficiency[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [daysToExam, setDaysToExam] = useState<number>(0);

  // Helper to get days until exam
  const getDaysToExam = useCallback((date: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDay = new Date(date);
    examDay.setHours(0, 0, 0, 0);

    const timeDiff = examDay.getTime() - today.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  }, []);

  // Calculate subject proficiency and recommended difficulty
  const calculateSubjectProficiency = useCallback(() => {
    try {
      // Group tests by subject
      const subjectGroups: Record<string, Test[]> = {};

      tests.forEach(test => {
        const subject = test.subjectName;

        if (!subjectGroups[subject]) {
          subjectGroups[subject] = [];
        }

        subjectGroups[subject].push(test);
      });

      // Calculate proficiency for each subject in the blueprint
      const proficiencyData: SubjectProficiency[] = examBlueprint.map(blueprint => {
        // Find tests for this subject (case insensitive matching)
        const matchingTests = Object.entries(subjectGroups)
          .filter(([subject]) => subject.toLowerCase() === blueprint.topic.toLowerCase())
          .flatMap(([, tests]) => tests);

        // Calculate metrics
        const testsTotal = matchingTests.length;
        const testsCompleted = matchingTests.filter(test => test.completed).length;

        // Simple proficiency score: percentage of completed tests, with a minimum of 10%
        const proficiencyScore = testsTotal > 0
          ? Math.max(10, Math.round((testsCompleted / testsTotal) * 100))
          : 10;

        // Determine difficulty based on proficiency and time to exam
        let difficulty: 'foundation' | 'moderate' | 'advanced';

        if (daysToExam < 14) {
          // Close to exam: focus on strengths and maintain current level
          difficulty = proficiencyScore >= 70 ? 'advanced' :
            proficiencyScore >= 40 ? 'moderate' : 'foundation';
        } else if (daysToExam < 30) {
          // Medium-term: push to higher difficulty if doing well
          difficulty = proficiencyScore >= 80 ? 'advanced' :
            proficiencyScore >= 50 ? 'moderate' : 'foundation';
        } else {
          // Long-term: challenge appropriately for growth
          difficulty = proficiencyScore >= 90 ? 'advanced' :
            proficiencyScore >= 60 ? 'moderate' : 'foundation';
        }

        // Calculate urgency based on blueprint percentage and proficiency
        // Higher blueprint percentage + lower proficiency = higher urgency
        const urgencyScore = (blueprint.percentage * (100 - proficiencyScore)) / 100;
        let urgency: 'low' | 'medium' | 'high';

        if (urgencyScore > 15) {
          urgency = 'high';
        } else if (urgencyScore > 7) {
          urgency = 'medium';
        } else {
          urgency = 'low';
        }

        return {
          subject: blueprint.topic,
          testsTotal,
          testsCompleted,
          proficiencyScore,
          difficulty,
          urgency
        };
      });

      // Sort by urgency (highest first), then blueprint percentage
      proficiencyData.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

      setSubjectProficiency(proficiencyData);
    } catch (error) {
      console.error("Error calculating subject proficiency:", error);
      toast.error("Failed to calculate study difficulty levels");
    }
  }, [tests, examBlueprint, daysToExam]); // Added dependencies here

  // Fetch test data and exam blueprint
  useEffect(() => {
    if (!userId || !selectedExam || !examDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Calculate days to exam
        const days = getDaysToExam(examDate);
        setDaysToExam(days);

        if (days <= 0) {
          // throw new Error("Exam date must be in the future");
        }

        // Fetch test data
        const testsResponse = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/calender/${userId}`);

        if (Array.isArray(testsResponse.data)) {
          setTests(testsResponse.data);
        } else {
          throw new Error("Invalid test data format");
        }

        // Fetch exam blueprint
        try {
          const blueprintResponse = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/exams/blueprint/${selectedExam}`);

          if (blueprintResponse.data && Array.isArray(blueprintResponse.data)) {
            setExamBlueprint(blueprintResponse.data);
          } else {
            throw new Error("Invalid blueprint data format");
          }
        } catch (blueprintError) {
          console.error("Error fetching blueprint:", blueprintError);
          toast.error("Failed to fetch exam blueprint data");

          // Fallback blueprint data in case API fails
          setExamBlueprint([
            { topic: "Biology", percentage: 35 },
            { topic: "Chemistry", percentage: 25 },
            { topic: "Physics", percentage: 25 },
            { topic: "Psychology", percentage: 15 }
          ]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "Failed to fetch data");
        toast.error("Failed to load data for adaptive study tracker");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, selectedExam, examDate, getDaysToExam]);

  // Calculate subject proficiency once data is loaded
  useEffect(() => {
    if (!examBlueprint.length || daysToExam <= 0) return;
    calculateSubjectProficiency();
  }, [tests, examBlueprint, daysToExam, calculateSubjectProficiency]); // Added calculateSubjectProficiency to dependency array

  // Format date as a readable string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // Get the priority subject (first high urgency or first in list)
  const getPrioritySubject = (): SubjectProficiency | null => {
    if (subjectProficiency.length === 0) return null;

    const highUrgencySubject = subjectProficiency.find(s => s.urgency === 'high');
    return highUrgencySubject || subjectProficiency[0];
  };

  // If no exam selected or no date set
  if (!selectedExam || !examDate) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center">
          <Zap className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Adaptive Study Tracker</h2>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-center">
          <AlertTriangle className="text-yellow-500 mr-2" />
          <p>Please select an exam and set an exam date to enable adaptive study tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Zap className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Adaptive Study Tracker</h2>
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
          Click to expand and view adaptive study recommendations.
        </div>
      ) : (
        <>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col justify-center">
                  <div className="text-sm text-blue-700 mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1" /> Time Remaining
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {daysToExam} {daysToExam === 1 ? 'day' : 'days'}
                  </div>
                  <div className="text-xs text-blue-700">
                    Until {selectedExam} on {formatDate(examDate)}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-700 mb-1 flex items-center">
                    <BookCheck className="h-4 w-4 mr-1" /> Study Progress
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {tests.filter(t => t.completed).length}/{tests.length}
                  </div>
                  <div className="text-xs text-green-700">
                    Tests completed ({Math.round((tests.filter(t => t.completed).length / Math.max(1, tests.length)) * 100)}%)
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-700 mb-1 flex items-center">
                    <Target className="h-4 w-4 mr-1" /> Priority Subject
                  </div>
                  {getPrioritySubject() && (
                    <>
                      <div className="text-2xl font-bold text-purple-900">
                        {getPrioritySubject()?.subject}
                      </div>
                      <div className="text-xs text-purple-700 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${getPrioritySubject()?.urgency === 'high'
                          ? 'bg-red-500'
                          : getPrioritySubject()?.urgency === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          } mr-1`}></span>
                        {getPrioritySubject()?.proficiencyScore}% proficiency • {getPrioritySubject()?.urgency} priority
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdaptiveStudyTracker;