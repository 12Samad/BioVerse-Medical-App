"use client"

import axios from 'axios';
import { ActivitySquare, AlertTriangle, Award, BookCheck, BookOpen, ChevronDown, ChevronUp, Clock, LineChart } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ExamReadinessDashboardProps {
  selectedExam: string;
  userId: string;
  examDate?: string; // Optional prop for time-based readiness calculation
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

interface SubjectReadiness {
  subject: string;
  testsTotal: number;
  testsCompleted: number;
  completionRate: number;
  blueprintPercentage: number;
  readinessScore: number;
  color: string;
}

interface OverallReadiness {
  score: number;
  status: 'low' | 'moderate' | 'high';
  completionRate: number;
  subjectsCovered: number;
  totalSubjects: number;
  daysToExam?: number;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57'
];

const ExamReadinessDashboard: React.FC<ExamReadinessDashboardProps> = ({ selectedExam, userId, examDate }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [examBlueprint, setExamBlueprint] = useState<ExamBlueprint[]>([]);
  const [subjectReadiness, setSubjectReadiness] = useState<SubjectReadiness[]>([]);
  const [overallReadiness, setOverallReadiness] = useState<OverallReadiness | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAllSubjects, setShowAllSubjects] = useState<boolean>(false);

  // Helper to get days until exam
  const getDaysToExam = useCallback((date: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDay = new Date(date);
    examDay.setHours(0, 0, 0, 0);

    const timeDiff = examDay.getTime() - today.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  }, []);

  // Calculate overall readiness score
  const calculateOverallReadiness = useCallback((subjects: SubjectReadiness[]) => {
    // Count total and completed tests
    const totalTests = tests.length;
    const completedTests = tests.filter(test => test.completed).length;
    const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

    // Count subjects covered (has at least one completed test)
    const subjectsWithCompletedTests = subjects.filter(s => s.testsCompleted > 0);
    const subjectsCovered = subjectsWithCompletedTests.length;

    // Calculate weighted average of subject readiness scores
    let weightedReadinessSum = 0;
    let totalWeight = 0;

    subjects.forEach(subject => {
      // Only include blueprint subjects in this calculation
      if (subject.blueprintPercentage > 0) {
        weightedReadinessSum += subject.readinessScore * subject.blueprintPercentage;
        totalWeight += subject.blueprintPercentage;
      }
    });

    // Readiness score (based on subject coverage and completion, weighted by blueprint)
    let overallScore = totalWeight > 0 ? weightedReadinessSum / totalWeight : 0;

    // Adjust score based on time left until exam if exam date is provided
    if (examDate) {
      const today = new Date();
      const examDay = new Date(examDate);
      const daysToExam = Math.max(0, Math.floor((examDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      // Time pressure factor: the closer to exam, the more penalized for low readiness
      // Assumes a typical study period of 90 days
      const timePressureFactor = Math.max(0, Math.min(1, daysToExam / 90));

      // Adjust score based on time pressure
      // As exam approaches, time pressure increases importance
      const timeAdjustedScore = overallScore * (0.7 + 0.3 * timePressureFactor);

      overallScore = timeAdjustedScore;
    }

    // Cap score at 100
    overallScore = Math.min(100, overallScore);

    // Determine readiness status
    let status: 'low' | 'moderate' | 'high' = 'low';
    if (overallScore >= 75) {
      status = 'high';
    } else if (overallScore >= 50) {
      status = 'moderate';
    }

    setOverallReadiness({
      score: Math.round(overallScore),
      status,
      completionRate,
      subjectsCovered,
      totalSubjects: examBlueprint.length,
      daysToExam: examDate ? getDaysToExam(examDate) : undefined
    });
  }, [tests, examBlueprint, examDate, getDaysToExam]);

  // Calculate readiness metrics
  const calculateReadiness = useCallback(() => {
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

      // Calculate readiness for each subject in the blueprint
      const subjectReadinessData: SubjectReadiness[] = examBlueprint.map(blueprint => {
        // Find tests for this subject (case insensitive matching)
        const testsForSubject = subjectGroups[blueprint.topic] || [];

        // Calculate metrics
        const testsTotal = testsForSubject.length;
        const testsCompleted = testsForSubject.filter(test => test.completed).length;
        const completionRate = testsTotal > 0 ? (testsCompleted / testsTotal) * 100 : 0;

        // Base readiness score calculation
        // Formula: 0.7 * completion rate + 0.3 * (if there are enough tests scheduled relative to blueprint weight)
        const scheduledTestsAdequacy = Math.min(100, (testsTotal / Math.max(1, blueprint.percentage / 10)) * 100);
        let readinessScore = (0.7 * completionRate) + (0.3 * scheduledTestsAdequacy);

        // Cap score at 100
        readinessScore = Math.min(100, readinessScore);

        // Get color from any test for this subject, or generate one
        const color = testsForSubject.length > 0 && testsForSubject[0].color
          ? testsForSubject[0].color
          : COLORS[examBlueprint.findIndex(b => b.topic === blueprint.topic) % COLORS.length];

        return {
          subject: blueprint.topic,
          testsTotal,
          testsCompleted,
          completionRate,
          blueprintPercentage: blueprint.percentage,
          readinessScore,
          color
        };
      });

      // Add subjects that have tests but aren't in the blueprint
      Object.keys(subjectGroups).forEach(subject => {
        const existingSubject = subjectReadinessData.find(
          s => s.subject.toLowerCase() === subject.toLowerCase()
        );

        if (!existingSubject) {
          const testsForSubject = subjectGroups[subject];
          const testsTotal = testsForSubject.length;
          const testsCompleted = testsForSubject.filter(test => test.completed).length;
          const completionRate = testsTotal > 0 ? (testsCompleted / testsTotal) * 100 : 0;

          // For non-blueprint subjects, use a simplified readiness calculation
          const readinessScore = completionRate;

          // Get color from a test for this subject, or use default
          const color = testsForSubject.length > 0 && testsForSubject[0].color
            ? testsForSubject[0].color
            : COLORS[subjectReadinessData.length % COLORS.length];

          subjectReadinessData.push({
            subject,
            testsTotal,
            testsCompleted,
            completionRate,
            blueprintPercentage: 0, // Not in blueprint
            readinessScore,
            color
          });
        }
      });

      // Sort by blueprint percentage (highest first)
      subjectReadinessData.sort((a, b) => b.blueprintPercentage - a.blueprintPercentage);

      setSubjectReadiness(subjectReadinessData);

      // Calculate overall readiness
      calculateOverallReadiness(subjectReadinessData);

    } catch (error) {
      console.error("Error calculating readiness:", error);
      toast.error("An error occurred while calculating your exam readiness");
    }
  }, [tests, examBlueprint, calculateOverallReadiness]);

  // Fetch test data
  useEffect(() => {
    if (!userId || !selectedExam) return;

    const fetchTestData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch test data
        const testsResponse = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/calender/${userId}`);

        if (Array.isArray(testsResponse.data)) {
          setTests(testsResponse.data);
          console.log(testsResponse.data);

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
          toast.error("Failed to fetch exam blueprint. Readiness analysis may be limited.");
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch your test data. Please try again later.");
        toast.error("Failed to load your test data");
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [userId, selectedExam]);

  // Calculate readiness metrics once data is loaded
  useEffect(() => {
    if (!tests.length || !examBlueprint.length) return;
    calculateReadiness();
  }, [tests, examBlueprint, examDate, calculateReadiness]); // Added calculateReadiness to the dependency array

  // Create chart data for subject readiness vs blueprint
  const getSubjectChartData = () => {
    return subjectReadiness
      .filter(subject => subject.blueprintPercentage > 0) // Only blueprint subjects
      .map(subject => ({
        name: subject.subject,
        readiness: Math.round(subject.readinessScore),
        blueprint: subject.blueprintPercentage,
        color: subject.color
      }));
  };

  // Generate readiness recommendations
  const getRecommendations = (): string[] => {
    if (!subjectReadiness.length) return [];

    const recommendations: string[] = [];

    // Find subjects that need the most attention
    const lowReadinessSubjects = subjectReadiness
      .filter(s => s.blueprintPercentage > 0) // Only consider blueprint subjects
      .sort((a, b) => a.readinessScore - b.readinessScore)
      .slice(0, 3);

    lowReadinessSubjects.forEach(subject => {
      if (subject.readinessScore < 50) {
        if (subject.testsTotal === 0) {
          recommendations.push(`Schedule tests for ${subject.subject} (${subject.blueprintPercentage}% of exam).`);
        } else if (subject.completionRate < 50) {
          recommendations.push(`Complete more ${subject.subject} tests (current completion: ${Math.round(subject.completionRate)}%).`);
        } else {
          recommendations.push(`Increase test coverage for ${subject.subject} to improve readiness.`);
        }
      }
    });

    // Overall recommendations
    if (overallReadiness) {
      if (overallReadiness.score < 40) {
        recommendations.push("Focus on completing scheduled tests before adding new ones.");
      } else if (overallReadiness.subjectsCovered < overallReadiness.totalSubjects) {
        recommendations.push(`Expand your study to cover all ${overallReadiness.totalSubjects} exam subjects.`);
      }

      if (overallReadiness.daysToExam !== undefined && overallReadiness.daysToExam < 30 && overallReadiness.score < 70) {
        recommendations.push(`With only ${overallReadiness.daysToExam} days left, increase your study pace.`);
      }
    }

    return recommendations;
  };

  // Get text status color
  const getTextStatusColor = (status: 'low' | 'moderate' | 'high'): string => {
    switch (status) {
      case 'high': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get color for readiness score
  const getReadinessColor = (score: number): string => {
    if (score >= 75) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Component to render the readiness score gauge
  const ReadinessGauge = ({ score }: { score: number }) => {
    const color = getReadinessColor(score);

    return (
      <div className="relative w-32 h-32 mx-auto">
        {/* Background circle */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
          />
          {/* Foreground circle (progress) */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${score * 2.83} 283`} // 283 is approx 2*PI*r
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold" style={{ color }}>{score}%</span>
          <span className="text-xs text-gray-500">Readiness</span>
        </div>
      </div>
    );
  };

  if (!selectedExam || !userId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center">
          <Award className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Exam Readiness Dashboard</h2>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-center">
          <AlertTriangle className="text-yellow-500 mr-2" />
          <p>Please select an exam to view your readiness metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Award className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Exam Readiness Dashboard</h2>
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
          Click to expand and view your exam readiness metrics.
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
          ) : tests.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Test Data Available</h3>
              <p className="text-gray-500 mb-4">
                Schedule and complete some tests to see your exam readiness metrics.
              </p>
            </div>
          ) : (
            <div>
              {/* Overview Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Readiness Score */}
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
                  {overallReadiness && (
                    <>
                      <ReadinessGauge score={overallReadiness.score} />
                      <div className="mt-2 text-center">
                        <p className={`font-medium ${getTextStatusColor(overallReadiness.status)}`}>
                          {overallReadiness.status === 'high' ? 'Ready for Exam' :
                            overallReadiness.status === 'moderate' ? 'Making Progress' :
                              'Needs Improvement'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Test Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <BookCheck className="mr-1 h-4 w-4" /> Test Completion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tests Completed</span>
                        <span className="font-medium">
                          {tests.filter(t => t.completed).length}/{tests.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${tests.length > 0 ?
                              (tests.filter(t => t.completed).length / tests.length) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Subjects Covered</span>
                        <span className="font-medium">
                          {overallReadiness?.subjectsCovered || 0}/{overallReadiness?.totalSubjects || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${overallReadiness?.totalSubjects ?
                              (overallReadiness.subjectsCovered / overallReadiness.totalSubjects) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exam Timeline */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <Clock className="mr-1 h-4 w-4" /> Exam Timeline
                  </h3>

                  {examDate ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-3xl font-bold text-blue-600">
                        {overallReadiness?.daysToExam}
                      </div>
                      <div className="text-sm text-gray-500">
                        {overallReadiness?.daysToExam === 1 ? 'day' : 'days'} remaining
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Exam Date: {new Date(examDate).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <p>No exam date set</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Readiness by Subject */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <ActivitySquare className="mr-1 h-5 w-5" /> Subject Readiness
                </h3>

                <div className="space-y-3">
                  {subjectReadiness
                    .filter(subject => subject.blueprintPercentage > 0) // Only show blueprint subjects
                    .slice(0, showAllSubjects ? undefined : 5) // Show 5 or all
                    .map((subject, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: subject.color }}
                            ></div>
                            <span className="font-medium">{subject.subject}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {subject.blueprintPercentage}% of exam
                          </div>
                        </div>

                        <div className="flex justify-between text-xs mb-1">
                          <span>Readiness</span>
                          <span className="font-medium">{Math.round(subject.readinessScore)}%</span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${subject.readinessScore}%`,
                              backgroundColor: getReadinessColor(subject.readinessScore)
                            }}
                          ></div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          {subject.testsCompleted}/{subject.testsTotal} tests completed
                        </div>
                      </div>
                    ))}
                </div>

                {subjectReadiness.filter(s => s.blueprintPercentage > 0).length > 5 && (
                  <button
                    onClick={() => setShowAllSubjects(!showAllSubjects)}
                    className="mt-3 text-blue-500 hover:text-blue-700 text-sm flex items-center mx-auto"
                  >
                    {showAllSubjects ? (
                      <>
                        <ChevronUp size={16} className="mr-1" /> Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} className="mr-1" /> Show All Subjects
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Charts Section */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <LineChart className="mr-1 h-5 w-5" /> Readiness Analysis
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getSubjectChartData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="blueprint" name="Exam Weight" fill="#8884d8" />
                        <Bar dataKey="readiness" name="Your Readiness" fill="#82ca9d">
                          {getSubjectChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Recommendations</h3>
                <ul className="space-y-1">
                  {getRecommendations().map((rec, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                  {getRecommendations().length === 0 && (
                    <li className="text-sm italic text-blue-600">
                      Keep up the good work! You&apos;re on track for your exam.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamReadinessDashboard;