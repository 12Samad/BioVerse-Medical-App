"use client"

import axios from 'axios';
import { AlertTriangle, BarChart3, PieChartIcon, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Test {
  _id?: string;
  subjectName: string;
  testTopic: string;
  date: string;
  color: string;
  completed?: boolean;
}

interface TopicDistribution {
  topic: string;
  percentage: number;
}

interface StudyPatternAnalyzerProps {
  selectedExam: string;
  tests: Test[];
}

// Standard exam blueprints as fallback
const standardBlueprints: Record<string, TopicDistribution[]> = {
  "USMLE Step 1": [
    { topic: "Anatomy", percentage: 15 },
    { topic: "Physiology", percentage: 20 },
    { topic: "Biochemistry", percentage: 15 },
    { topic: "Pharmacology", percentage: 15 },
    { topic: "Pathology", percentage: 25 },
    { topic: "Microbiology", percentage: 10 }
  ],
  "NEET": [
    { topic: "Physics", percentage: 25 },
    { topic: "Chemistry", percentage: 25 },
    { topic: "Biology", percentage: 30 },
    { topic: "Zoology", percentage: 10 },
    { topic: "Botany", percentage: 10 }
  ],
  "PLAB": [
    { topic: "Clinical Medicine", percentage: 35 },
    { topic: "Surgery", percentage: 25 },
    { topic: "Obstetrics", percentage: 15 },
    { topic: "Gynecology", percentage: 15 },
    { topic: "Psychiatry", percentage: 10 }
  ],
  "MCAT": [
    { topic: "Biology", percentage: 35 },
    { topic: "Chemistry", percentage: 25 },
    { topic: "Physics", percentage: 25 },
    { topic: "Psychology", percentage: 15 }
  ],
  "NCLEX": [
    { topic: "Fundamentals", percentage: 15 },
    { topic: "Medical-Surgical", percentage: 40 },
    { topic: "Pharmacology", percentage: 15 },
    { topic: "Maternal Newborn", percentage: 15 },
    { topic: "Pediatrics", percentage: 15 }
  ],
  "COMLEX": [
    { topic: "Osteopathic Principles", percentage: 25 },
    { topic: "Anatomy", percentage: 20 },
    { topic: "Microbiology", percentage: 15 },
    { topic: "Pathology", percentage: 20 },
    { topic: "Pharmacology", percentage: 20 }
  ]
};

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const StudyPatternAnalyzer: React.FC<StudyPatternAnalyzerProps> = ({ selectedExam, tests }) => {
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [userDistribution, setUserDistribution] = useState<TopicDistribution[]>([]);
  const [examBlueprint, setExamBlueprint] = useState<TopicDistribution[]>([]);
  const [comparisonData, setComparisonData] = useState<{ topic: string; blueprint: number; user: number; difference: number }[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState<boolean>(false);
  const [usingDynamicBlueprint, setUsingDynamicBlueprint] = useState<boolean>(false);
  const [completedTestCount, setCompletedTestCount] = useState<number>(0);

  // Fetch exam blueprint dynamically - wrapped in useCallback
  const fetchExamBlueprint = useCallback(async () => {
    setIsLoadingBlueprint(true);

    try {
      // Start with standard blueprint (reliable fallback)
      const standardBlueprint = standardBlueprints[selectedExam] || [];
      if (standardBlueprint.length > 0) {
        setExamBlueprint(standardBlueprint);
        setUsingDynamicBlueprint(false);
      }

      // Try to fetch dynamic blueprint
      try {
        const response = await axios.get(
          `https://medical-backend-loj4.onrender.com/api/test/exams/blueprint/${selectedExam}`
        );

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setExamBlueprint(response.data);
          setUsingDynamicBlueprint(true);
          setIsLoadingBlueprint(false);
          return;
        }
      } catch {
        console.log("Blueprint endpoint not available, using standard blueprint");
        // Continue with standard blueprint
      }
    } catch (error) {
      console.error("Error setting exam blueprint:", error);
      toast.error("Failed to load exam blueprint. Using standard distribution.");
    } finally {
      setIsLoadingBlueprint(false);
    }
  }, [selectedExam]); // Added selectedExam as a dependency

  // Generate feedback function
  const generateFeedback = useCallback((comparison: { topic: string; blueprint: number; user: number; difference: number }[]): string[] => {
    const messages: string[] = [];

    // Add overall message
    messages.push(`Analysis based on ${selectedExam} blueprint and your ${completedTestCount} completed tests.`);

    // Sort by absolute difference to highlight the most significant gaps
    const sortedByDifference = [...comparison].sort((a, b) =>
      Math.abs(b.difference) - Math.abs(a.difference)
    );

    // Generate specific feedback for topics with significant differences
    sortedByDifference.slice(0, 3).forEach(item => {
      if (item.difference < -5) {
        messages.push(`Increase your focus on ${item.topic} by ${Math.abs(item.difference)}%.`);
      } else if (item.difference > 5) {
        messages.push(`You're studying ${item.topic} ${item.difference}% more than needed for the exam.`);
      }
    });

    // Add a strategic message if applicable
    if (sortedByDifference.some(item => item.difference < -10)) {
      messages.push("Consider reallocating your study time to better match the exam distribution.");
    }

    return messages;
  }, [selectedExam, completedTestCount]);

  // Analyze study pattern function - wrapped in useCallback
  const analyzeStudyPattern = useCallback(() => {
    setIsLoading(true);

    try {
      // Get completed tests only
      // const completedTests = tests.filter(test => test.completed);
      // For testing: use all tests instead of just completed ones
      const completedTests = tests;
      setCompletedTestCount(completedTests.length);

      if (completedTests.length === 0) {
        // Clear previous data
        setUserDistribution([]);
        setComparisonData([]);
        setFeedback(['You have no completed tests to analyze. Complete some tests to see your study pattern.']);
        setIsLoading(false);
        return;
      }

      // Calculate user's distribution
      const subjectCount: Record<string, number> = {};
      let totalTests = 0;

      // Count tests by subject
      completedTests.forEach(test => {
        // Normalize subject names to match blueprint names (case insensitive matching)
        const normalizedSubject = test.subjectName.trim();

        // Find a matching blueprint topic (case insensitive)
        const matchingBlueprintTopic = examBlueprint.find(
          item => item.topic.toLowerCase() === normalizedSubject.toLowerCase()
        );

        // Use matched topic name or original name if no match
        const subjectKey = matchingBlueprintTopic ? matchingBlueprintTopic.topic : normalizedSubject;

        if (!subjectCount[subjectKey]) {
          subjectCount[subjectKey] = 0;
        }

        subjectCount[subjectKey]++;
        totalTests++;
      });

      // Convert to percentage distribution
      const userDistData: TopicDistribution[] = Object.keys(subjectCount).map(subject => ({
        topic: subject,
        percentage: Math.round((subjectCount[subject] / totalTests) * 100)
      }));

      // Prepare comparison data for bar chart
      const comparisonResult: { topic: string; blueprint: number; user: number; difference: number }[] = [];

      // Create a map of the user's distribution for quick lookup
      const userDistMap = new Map(userDistData.map(item => [item.topic.toLowerCase(), item]));

      // Process the blueprint topics to create comparison data
      examBlueprint.forEach(item => {
        const userTopic = userDistMap.get(item.topic.toLowerCase());
        const userPercentage = userTopic ? userTopic.percentage : 0;

        comparisonResult.push({
          topic: item.topic,
          blueprint: item.percentage,
          user: userPercentage,
          difference: userPercentage - item.percentage
        });

        // Remove the topic from the map as it's been processed
        userDistMap.delete(item.topic.toLowerCase());
      });

      // Add any remaining user topics that weren't in the blueprint
      userDistMap.forEach((value) => {
        comparisonResult.push({
          topic: value.topic,
          blueprint: 0, // Not in blueprint
          user: value.percentage,
          difference: value.percentage
        });
      });

      // Generate feedback
      const feedbackMessages = generateFeedback(comparisonResult);

      setUserDistribution(userDistData);
      setComparisonData(comparisonResult);
      setFeedback(feedbackMessages);
    } catch (error) {
      console.error("Error analyzing study pattern:", error);
      toast.error("Failed to analyze your study pattern. Please try again.");
      setFeedback(['Error analyzing your study pattern. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  }, [tests, examBlueprint, generateFeedback]);

  // Fetch exam blueprint when the selected exam changes
  useEffect(() => {
    if (selectedExam) {
      fetchExamBlueprint();
    }
  }, [selectedExam, fetchExamBlueprint]); // Added fetchExamBlueprint to the dependency array

  // Trigger analysis when show is toggled or dependencies change
  useEffect(() => {
    if (showAnalysis && selectedExam && tests.length > 0 && examBlueprint.length > 0) {
      analyzeStudyPattern();
    }
  }, [showAnalysis, selectedExam, tests, examBlueprint, analyzeStudyPattern]); // Added analyzeStudyPattern to the dependency array

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <PieChartIcon size={24} className="text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Study Pattern Analyzer</h2>
        </div>
        <div className="flex gap-2">
          {selectedExam && (
            <button
              onClick={fetchExamBlueprint}
              className="bg-gray-200 text-gray-700 py-2 px-3 rounded hover:bg-gray-300 transition-colors flex items-center"
              disabled={isLoadingBlueprint}
              title="Refresh blueprint data"
            >
              <RefreshCw size={18} className={`mr-1 ${isLoadingBlueprint ? 'animate-spin' : ''}`} />
              {isLoadingBlueprint ? "Loading..." : "Refresh"}
            </button>
          )}
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
            disabled={!selectedExam}
          >
            <BarChart3 size={20} className="mr-2" />
            {showAnalysis ? "Hide Analysis" : "Show Analysis"}
          </button>
        </div>
      </div>

      {/* Description */}
      {selectedExam && (
        <div className="text-sm text-gray-600 mb-4">
          <p>
            Compare your completed test pattern with the {selectedExam} blueprint.
            {usingDynamicBlueprint
              ? " Blueprint data is based on actual question distribution in our database."
              : " Using standard exam distribution guidelines."}
          </p>
        </div>
      )}

      {!selectedExam && (
        <div className="flex items-center justify-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="text-yellow-500 mr-2" />
          <p>Please select an exam to see your study pattern analysis.</p>
        </div>
      )}

      {showAnalysis && selectedExam && (
        <div>
          {isLoadingBlueprint ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-pulse text-blue-500">Loading exam blueprint data...</div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-pulse text-blue-500">Analyzing your study pattern...</div>
            </div>
          ) : completedTestCount === 0 ? (
            // Empty state - no completed tests
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-gray-400 mb-4">
                <BarChart3 size={64} />
              </div>
              <p className="text-gray-600">
                You have no completed tests to analyze.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Complete some tests to see how your study pattern compares with the {selectedExam} blueprint.
              </p>
            </div>
          ) : (
            <>
              {/* Feedback Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Study Pattern Insights</h3>
                <ul className="space-y-1">
                  {feedback.map((message, index) => (
                    <li key={index} className="text-sm">
                      {index === 0 ? (
                        <strong>{message}</strong>
                      ) : (
                        <span>• {message}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Charts Section */}
              {comparisonData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart Comparison */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium text-gray-800 mb-2 text-center">Blueprint vs. Your Study Pattern</h3>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={comparisonData}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="topic" />
                          <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                          <Bar dataKey="blueprint" name="Exam Blueprint" fill="#0088FE" />
                          <Bar dataKey="user" name="Your Study Pattern" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Charts */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Blueprint Pie Chart */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-2 text-center">Exam Blueprint</h3>
                        <div className="h-40 md:h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={examBlueprint}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="percentage"
                                nameKey="topic"
                              >
                                {examBlueprint.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* User Distribution Pie Chart */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-2 text-center">Your Study Focus</h3>
                        <div className="h-40 md:h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={userDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="percentage"
                                nameKey="topic"
                              >
                                {userDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!showAnalysis && selectedExam && (
        <div className="text-gray-600 text-center py-4">
          Click &quot;Show Analysis&quot; to compare your study pattern with the {selectedExam} blueprint.
        </div>
      )}
    </div>
  );
};

export default StudyPatternAnalyzer;