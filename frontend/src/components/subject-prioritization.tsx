"use client"

import axios from 'axios';
import {
  AlertTriangle,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  PieChart,
  Star,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface SubjectPrioritizationProps {
  selectedExam: string;
  userId: string;
  examDate?: string;
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
  isHighYield?: boolean;
}

interface SubjectPriority {
  subject: string;
  blueprintPercentage: number;
  proficiencyScore: number;
  priorityScore: number;
  suggestedDifficulty: 'foundation' | 'moderate' | 'advanced';
  urgency: 'low' | 'medium' | 'high';
  isHighYield: boolean;
  recommendation: string;
}

const SubjectPrioritization: React.FC<SubjectPrioritizationProps> = ({
  selectedExam,
  userId,
  examDate
}) => {
  const [examBlueprint, setExamBlueprint] = useState<ExamBlueprint[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [subjectPriorities, setSubjectPriorities] = useState<SubjectPriority[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [daysToExam, setDaysToExam] = useState<number>(0);

  // Fetch exam blueprint and user tests
  useEffect(() => {
    if (!selectedExam || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Calculate days to exam if exam date is provided
        if (examDate) {
          const days = getDaysToExam(examDate);
          setDaysToExam(days);
        }

        // Fetch exam blueprint
        let blueprintData: ExamBlueprint[] = [];
        try {
          const blueprintResponse = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/exams/blueprint/${selectedExam}`);

          if (blueprintResponse.data && Array.isArray(blueprintResponse.data)) {
            blueprintData = blueprintResponse.data;
          } else {
            throw new Error("Invalid blueprint data format");
          }
        } catch (blueprintError) {
          console.error("Error fetching blueprint:", blueprintError);
          toast.error("Failed to fetch exam blueprint data");

          // Fallback blueprint data
          blueprintData = getFallbackBlueprintData(selectedExam);
        }

        // Mark high-yield subjects (subjects with higher than average percentage)
        const averagePercentage = blueprintData.reduce((sum, item) => sum + item.percentage, 0) / blueprintData.length;
        const highYieldThreshold = Math.max(averagePercentage * 1.2, 20); // 20% minimum or 20% above average

        const enhancedBlueprint = blueprintData.map(subject => ({
          ...subject,
          isHighYield: subject.percentage >= highYieldThreshold
        }));

        setExamBlueprint(enhancedBlueprint);

        // Fetch user tests
        try {
          const testsResponse = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/calender/${userId}`);

          if (Array.isArray(testsResponse.data)) {
            setTests(testsResponse.data);
          } else {
            throw new Error("Invalid test data format");
          }
        } catch (testsError) {
          console.error("Error fetching tests:", testsError);
          toast.error("Failed to fetch user test data");
          setTests([]);
        }

      } catch (error) {
        console.error("Error in data fetching:", error);
        setError(typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "Failed to fetch data");
        toast.error("Failed to load data for subject prioritization");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedExam, userId, examDate]);

  // Calculate subject priorities once data is loaded
  // useEffect(() => {
  //   if (!examBlueprint.length) return;

  //   calculateSubjectPriorities();
  // }, [examBlueprint, tests, daysToExam]);


  // Helper to get days until exam
  const getDaysToExam = (date: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDay = new Date(date);
    examDay.setHours(0, 0, 0, 0);

    const timeDiff = examDay.getTime() - today.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  };

  // Fallback blueprint data if API fails
  const getFallbackBlueprintData = (exam: string): ExamBlueprint[] => {
    const fallbackData: Record<string, ExamBlueprint[]> = {
      "USMLE Step 1": [
        { topic: "Anatomy", percentage: 25 },
        { topic: "Physiology", percentage: 20 },
        { topic: "Biochemistry", percentage: 15 },
        { topic: "Pharmacology", percentage: 15 },
        { topic: "Pathology", percentage: 25 }
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
        { topic: "Surgery", percentage: 20 },
        { topic: "Obstetrics", percentage: 15 },
        { topic: "Gynecology", percentage: 15 },
        { topic: "Psychiatry", percentage: 15 }
      ],
      "MCAT": [
        { topic: "Biology", percentage: 35 },
        { topic: "Chemistry", percentage: 25 },
        { topic: "Physics", percentage: 25 },
        { topic: "Psychology", percentage: 15 }
      ],
      "NCLEX": [
        { topic: "Fundamentals", percentage: 20 },
        { topic: "Medical-Surgical", percentage: 30 },
        { topic: "Pharmacology", percentage: 15 },
        { topic: "Maternal Newborn", percentage: 15 },
        { topic: "Pediatrics", percentage: 10 },
        { topic: "Mental Health", percentage: 10 }
      ],
      "COMLEX": [
        { topic: "Osteopathic Principles", percentage: 20 },
        { topic: "Anatomy", percentage: 20 },
        { topic: "Microbiology", percentage: 15 },
        { topic: "Pathology", percentage: 15 },
        { topic: "Pharmacology", percentage: 15 },
        { topic: "Behavioral Science", percentage: 15 }
      ]
    };

    return fallbackData[exam] || [
      { topic: "Subject 1", percentage: 30 },
      { topic: "Subject 2", percentage: 30 },
      { topic: "Subject 3", percentage: 20 },
      { topic: "Subject 4", percentage: 20 }
    ];
  };

  // // Calculate subject priorities
  // const calculateSubjectPriorities = () => {
  //   try {
  //     // Group tests by subject
  //     const subjectGroups: Record<string, Test[]> = {};

  //     tests.forEach(test => {
  //       const subject = test.subjectName;

  //       if (!subjectGroups[subject]) {
  //         subjectGroups[subject] = [];
  //       }

  //       subjectGroups[subject].push(test);
  //     });

  //     // Calculate priority for each subject in the blueprint
  //     const priorityData: SubjectPriority[] = examBlueprint.map(blueprint => {
  //       // Find tests for this subject (case insensitive matching)
  //       const matchingTests = Object.entries(subjectGroups)
  //         .filter(([subject]) => subject.toLowerCase() === blueprint.topic.toLowerCase())
  //         .flatMap(([, tests]) => tests);

  //       // Calculate proficiency
  //       const testsTotal = matchingTests.length;
  //       const testsCompleted = matchingTests.filter(test => test.completed).length;

  //       // Proficiency score: percentage of completed tests, with a minimum of 10%
  //       const proficiencyScore = testsTotal > 0
  //         ? Math.max(10, Math.round((testsCompleted / testsTotal) * 100))
  //         : 10;

  //       // Calculate urgency multiplier based on days to exam
  //       let urgencyMultiplier = 1;
  //       let urgency: 'low' | 'medium' | 'high' = 'medium';

  //       if (daysToExam > 0) {
  //         if (daysToExam <= 7) {
  //           urgencyMultiplier = 2;
  //           urgency = 'high';
  //         } else if (daysToExam <= 30) {
  //           urgencyMultiplier = 1.5;
  //           urgency = 'medium';
  //         } else {
  //           urgencyMultiplier = 1;
  //           urgency = 'low';
  //         }
  //       }

  //       // Calculate priority score using the formula
  //       const priorityScore = (blueprint.percentage * (1 - proficiencyScore / 100) * urgencyMultiplier);

  //       // Determine suggested difficulty based on proficiency and time to exam
  //       let suggestedDifficulty: 'foundation' | 'moderate' | 'advanced';

  //       if (daysToExam <= 14) {
  //         // Close to exam: focus on strengths and foundation
  //         suggestedDifficulty = proficiencyScore >= 70 ? 'advanced' :
  //           proficiencyScore >= 40 ? 'moderate' : 'foundation';
  //       } else if (daysToExam <= 30) {
  //         // Medium-term: push to higher difficulty if doing well
  //         suggestedDifficulty = proficiencyScore >= 80 ? 'advanced' :
  //           proficiencyScore >= 50 ? 'moderate' : 'foundation';
  //       } else {
  //         // Long-term: challenge appropriately for growth
  //         suggestedDifficulty = proficiencyScore >= 90 ? 'advanced' :
  //           proficiencyScore >= 60 ? 'moderate' : 'foundation';
  //       }

  //       // Generate recommendation based on all factors
  //       let recommendation = "";

  //       if (proficiencyScore < 30) {
  //         recommendation = `Focus on building ${blueprint.topic} fundamentals. Aim for at least 2-3 practice sessions.`;
  //       } else if (proficiencyScore < 70) {
  //         recommendation = `Continue strengthening your knowledge in ${blueprint.topic}. Take more practice tests.`;
  //       } else {
  //         recommendation = `Maintain your strong performance in ${blueprint.topic}. Focus on advanced concepts.`;
  //       }

  //       // If high-yield subject with low proficiency, add urgency to recommendation
  //       if (blueprint.isHighYield && proficiencyScore < 50) {
  //         recommendation = `PRIORITY: ${recommendation} This is a high-yield topic (${blueprint.percentage}% of exam).`;
  //       }

  //       // If close to exam with low proficiency, add time-based recommendation
  //       if (daysToExam <= 14 && proficiencyScore < 50) {
  //         recommendation += ` With only ${daysToExam} days remaining, prioritize this subject.`;
  //       }

  //       return {
  //         subject: blueprint.topic,
  //         blueprintPercentage: blueprint.percentage,
  //         proficiencyScore,
  //         priorityScore,
  //         suggestedDifficulty,
  //         urgency,
  //         isHighYield: blueprint.isHighYield || false,
  //         recommendation
  //       };
  //     });

  //     // Sort subjects by priority score (highest first)
  //     priorityData.sort((a, b) => b.priorityScore - a.priorityScore);

  //     setSubjectPriorities(priorityData);
  //   } catch (error) {
  //     console.error("Error calculating subject priorities:", error);
  //     toast.error("Failed to calculate subject priorities");
  //   }
  // };
  const calculateSubjectPriorities = useCallback(() => {
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

      // Calculate priority for each subject in the blueprint
      const priorityData: SubjectPriority[] = examBlueprint.map(blueprint => {
        // Find tests for this subject (case insensitive matching)
        const matchingTests = Object.entries(subjectGroups)
          .filter(([subject]) => subject.toLowerCase() === blueprint.topic.toLowerCase())
          .flatMap(([, tests]) => tests);

        // Calculate proficiency
        const testsTotal = matchingTests.length;
        const testsCompleted = matchingTests.filter(test => test.completed).length;
        const proficiencyScore = testsTotal > 0
          ? Math.max(10, Math.round((testsCompleted / testsTotal) * 100))
          : 10;

        // Calculate urgency multiplier based on days to exam
        let urgencyMultiplier = 1;
        let urgency: 'low' | 'medium' | 'high' = 'medium';
        if (daysToExam > 0) {
          if (daysToExam <= 7) {
            urgencyMultiplier = 2;
            urgency = 'high';
          } else if (daysToExam <= 30) {
            urgencyMultiplier = 1.5;
            urgency = 'medium';
          }
        }

        // Calculate priority score using the formula
        const priorityScore = (blueprint.percentage * (1 - proficiencyScore / 100) * urgencyMultiplier);

        // Determine suggested difficulty based on proficiency and time to exam
        let suggestedDifficulty: 'foundation' | 'moderate' | 'advanced';
        if (daysToExam <= 14) {
          suggestedDifficulty = proficiencyScore >= 70 ? 'advanced'
            : proficiencyScore >= 40 ? 'moderate' : 'foundation';
        } else if (daysToExam <= 30) {
          suggestedDifficulty = proficiencyScore >= 80 ? 'advanced'
            : proficiencyScore >= 50 ? 'moderate' : 'foundation';
        } else {
          suggestedDifficulty = proficiencyScore >= 90 ? 'advanced'
            : proficiencyScore >= 60 ? 'moderate' : 'foundation';
        }

        // Generate recommendation based on all factors
        let recommendation = "";
        if (proficiencyScore < 30) {
          recommendation = `Focus on building ${blueprint.topic} fundamentals. Aim for at least 2-3 practice sessions.`;
        } else if (proficiencyScore < 70) {
          recommendation = `Continue strengthening your knowledge in ${blueprint.topic}. Take more practice tests.`;
        } else {
          recommendation = `Maintain your strong performance in ${blueprint.topic}. Focus on advanced concepts.`;
        }

        if (blueprint.isHighYield && proficiencyScore < 50) {
          recommendation = `PRIORITY: ${recommendation} This is a high-yield topic (${blueprint.percentage}% of exam).`;
        }

        if (daysToExam <= 14 && proficiencyScore < 50) {
          recommendation += ` With only ${daysToExam} days remaining, prioritize this subject.`;
        }

        return {
          subject: blueprint.topic,
          blueprintPercentage: blueprint.percentage,
          proficiencyScore,
          priorityScore,
          suggestedDifficulty,
          urgency,
          isHighYield: blueprint.isHighYield || false,
          recommendation
        };
      });

      // Sort subjects by priority score (highest first)
      priorityData.sort((a, b) => b.priorityScore - a.priorityScore);
      setSubjectPriorities(priorityData);
    } catch (error) {
      console.error("Error calculating subject priorities:", error);
      toast.error("Failed to calculate subject priorities");
    }
  }, [examBlueprint, tests, daysToExam]);


  useEffect(() => {
    if (!examBlueprint.length) return;
    calculateSubjectPriorities();
  }, [examBlueprint, tests, daysToExam, calculateSubjectPriorities]);
  // Get color for difficulty level
  const getDifficultyBgColor = (level: 'foundation' | 'moderate' | 'advanced'): string => {
    switch (level) {
      case 'foundation': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get color for urgency level
  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high'): string => {
    switch (urgency) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Format date as a readable string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // Get days text for recommendation
  const getDaysText = (): string => {
    if (!examDate) return "";

    if (daysToExam <= 0) return "Exam day is today!";
    if (daysToExam === 1) return "Only 1 day left";
    if (daysToExam <= 7) return `Only ${daysToExam} days left`;
    if (daysToExam <= 30) return `${daysToExam} days remaining`;

    return `${daysToExam} days until exam`;
  };

  // If no exam selected
  if (!selectedExam) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center">
          <Target className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Subject Prioritization</h2>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-center">
          <AlertTriangle className="text-yellow-500 mr-2" />
          <p>Please select an exam to view subject prioritization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Target className="mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Subject Prioritization</h2>
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
          Click to expand and view subject prioritization for {selectedExam}.
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
          ) : subjectPriorities.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Subject Data Available</h3>
              <p className="text-gray-500 mb-4">
                We couldn&apos;t find subject data for {selectedExam}. Please check your exam selection.
              </p>
            </div>
          ) : (
            <div>
              {/* Summary Overview */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Based on the {selectedExam} exam blueprint, your current proficiency, and
                  {examDate ? ` ${getDaysText()}` : " exam proximity"}, we&apos;ve prioritized your study subjects:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Top priority subject card */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-red-600 mb-1 flex items-center">
                          <Zap className="h-4 w-4 mr-1" /> Top Priority
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {subjectPriorities[0].subject}
                        </div>
                      </div>
                      {subjectPriorities[0].isHighYield && (
                        <div className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          <Star className="h-3 w-3 mr-1" /> High-Yield
                        </div>
                      )}
                    </div>
                    <div className="mt-2 mb-1 text-sm">
                      <span className="font-medium">Blueprint: </span>
                      <span className="text-blue-700">{subjectPriorities[0].blueprintPercentage}%</span>
                    </div>
                    <div className="mb-2 text-sm">
                      <span className="font-medium">Proficiency: </span>
                      <span className={`${subjectPriorities[0].proficiencyScore < 50 ? 'text-red-600' : 'text-green-600'}`}>
                        {subjectPriorities[0].proficiencyScore}%
                      </span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Immediate attention required
                    </div>
                  </div>

                  {/* Second priority subject card */}
                  {subjectPriorities.length > 1 && (
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm text-orange-600 mb-1 flex items-center">
                            <ArrowUp className="h-4 w-4 mr-1" /> Second Priority
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {subjectPriorities[1].subject}
                          </div>
                        </div>
                        {subjectPriorities[1].isHighYield && (
                          <div className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            <Star className="h-3 w-3 mr-1" /> High-Yield
                          </div>
                        )}
                      </div>
                      <div className="mt-2 mb-1 text-sm">
                        <span className="font-medium">Blueprint: </span>
                        <span className="text-blue-700">{subjectPriorities[1].blueprintPercentage}%</span>
                      </div>
                      <div className="mb-2 text-sm">
                        <span className="font-medium">Proficiency: </span>
                        <span className={`${subjectPriorities[1].proficiencyScore < 50 ? 'text-red-600' : 'text-green-600'}`}>
                          {subjectPriorities[1].proficiencyScore}%
                        </span>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Focus after top priority
                      </div>
                    </div>
                  )}

                  {/* High-yield stats card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-blue-600 mb-1 flex items-center">
                      <PieChart className="h-4 w-4 mr-1" /> High-Yield Coverage
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {subjectPriorities.filter(s => s.isHighYield && s.proficiencyScore >= 70).length} / {subjectPriorities.filter(s => s.isHighYield).length}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">High-yield subjects mastered</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{
                        width: `${subjectPriorities.filter(s => s.isHighYield).length > 0
                          ? (subjectPriorities.filter(s => s.isHighYield && s.proficiencyScore >= 70).length /
                            subjectPriorities.filter(s => s.isHighYield).length) * 100
                          : 0}%`
                      }}></div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Focus on high-yield subjects first
                    </div>
                  </div>

                  {/* Time remaining card */}
                  {examDate && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <div className="text-sm text-purple-600 mb-1 flex items-center">
                        <Clock className="h-4 w-4 mr-1" /> Time Remaining
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {daysToExam} {daysToExam === 1 ? 'day' : 'days'}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Until {selectedExam}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        {formatDate(examDate)}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        {daysToExam <= 7 ? 'Focus on high-yield review' :
                          daysToExam <= 30 ? 'Balanced study approach' :
                            'Build foundations first'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Priority List */}
              <div>
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <TrendingUp className="mr-1 h-5 w-5" /> Subject Priority Ranking
                </h3>

                <div className="space-y-3">
                  {subjectPriorities
                    .slice(0, showAll ? undefined : 5)
                    .map((subject, index) => (
                      <div
                        key={subject.subject}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${index === 0 ? 'border-red-300 bg-red-50' :
                          index === 1 ? 'border-orange-300 bg-orange-50' :
                            index === 2 ? 'border-yellow-300 bg-yellow-50' :
                              'border-gray-200'
                          }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                          <div className="flex items-center">
                            <div className="mr-2 w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                              {index + 1}
                            </div>
                            <h4 className="font-medium text-lg">
                              {subject.subject}
                              {subject.isHighYield && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Star className="h-3 w-3 mr-1" /> High-Yield
                                </span>
                              )}
                            </h4>
                          </div>

                          <div className="flex space-x-3 mt-2 md:mt-0">
                            <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyBgColor(subject.suggestedDifficulty)}`}>
                              {subject.suggestedDifficulty.charAt(0).toUpperCase() + subject.suggestedDifficulty.slice(1)}
                            </span>
                            <span className={`flex items-center ${getUrgencyColor(subject.urgency)}`}>
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${subject.urgency === 'high'
                                  ? 'bg-red-500'
                                  : subject.urgency === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                  } mr-1`}
                              ></span>
                              {subject.urgency.charAt(0).toUpperCase() + subject.urgency.slice(1)} Priority
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Blueprint Weight</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${subject.blueprintPercentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs mt-1">{subject.blueprintPercentage}% of exam</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-1">Your Proficiency</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${subject.proficiencyScore >= 70 ? 'bg-green-500' :
                                  subject.proficiencyScore >= 40 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${subject.proficiencyScore}%` }}
                              ></div>
                            </div>
                            <div className="text-xs mt-1">{subject.proficiencyScore}% mastery</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-1">Priority Score</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, (subject.priorityScore / subjectPriorities[0].priorityScore) * 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs mt-1">{subject.priorityScore.toFixed(1)} points</div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <p>{subject.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {subjectPriorities.length > 5 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-4 text-blue-500 hover:text-blue-700 text-sm flex items-center mx-auto"
                  >
                    {showAll ? (
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

              {/* Study Recommendations */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                  <BookOpen className="h-5 w-5 mr-1" /> Smart Study Recommendations
                </h3>
                <ul className="space-y-2">
                  {/* Time-based recommendation */}
                  {examDate && (
                    <li className="text-sm flex items-start">
                      <Clock className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span>
                        {daysToExam <= 7
                          ? `With only ${daysToExam} days remaining, focus on rapid review of high-yield topics and practice questions.`
                          : daysToExam <= 30
                            ? `With ${daysToExam} days remaining, balance content review with practice questions.`
                            : `With ${daysToExam} days remaining, focus on building strong foundations in all subjects.`}
                      </span>
                    </li>
                  )}

                  {/* Top subject recommendation */}
                  {subjectPriorities.length > 0 && (
                    <li className="text-sm flex items-start">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span>
                        Prioritize {subjectPriorities[0].subject}
                        {subjectPriorities.length > 1 ? ` and ${subjectPriorities[1].subject}` : ''}
                        in your next study sessions.
                      </span>
                    </li>
                  )}

                  {/* High-yield coverage recommendation */}
                  {subjectPriorities.filter(s => s.isHighYield).length > 0 && (
                    <li className="text-sm flex items-start">
                      <Star className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span>
                        {subjectPriorities.filter(s => s.isHighYield && s.proficiencyScore < 70).length > 0
                          ? `Focus on the high-yield subjects that need improvement: ${subjectPriorities
                            .filter(s => s.isHighYield && s.proficiencyScore < 70)
                            .map(s => s.subject)
                            .slice(0, 2)
                            .join(' and ')}${subjectPriorities.filter(s => s.isHighYield && s.proficiencyScore < 70).length > 2 ? ' and others.' : '.'}`
                          : 'Great job! You have good proficiency in all high-yield subjects. Maintain your knowledge with regular review.'}
                      </span>
                    </li>
                  )}

                  {/* Lowest proficiency recommendation */}
                  {subjectPriorities.filter(s => s.proficiencyScore < 40).length > 0 && (
                    <li className="text-sm flex items-start">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span>
                        Improve your foundation in {subjectPriorities
                          .filter(s => s.proficiencyScore < 40)
                          .map(s => s.subject)
                          .slice(0, 2)
                          .join(' and ')}. Start with basic concepts before advancing.
                      </span>
                    </li>
                  )}

                  {/* Study strategy recommendation */}
                  <li className="text-sm flex items-start">
                    <Zap className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      For optimal results, spend {subjectPriorities.length > 0 ? Math.max(1, Math.min(3, Math.ceil(subjectPriorities[0].blueprintPercentage / 10))) : 1}-{subjectPriorities.length > 0 ? Math.max(2, Math.min(5, Math.ceil(subjectPriorities[0].blueprintPercentage / 5))) : 2} hours on {subjectPriorities.length > 0 ? subjectPriorities[0].subject : "your top priority subject"} before moving to lower priority subjects.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubjectPrioritization;