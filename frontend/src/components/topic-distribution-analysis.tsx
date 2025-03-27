import { ChartArea } from "lucide-react";
import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

interface TopicDistributionProps {
  selectedExam: string;
  tests: Test[];
}

// Static blueprint data for each exam
const examBlueprints: Record<string, TopicDistribution[]> = {
  "USMLE Step 1": [
    { topic: "Anatomy", percentage: 15 },
    { topic: "Physiology", percentage: 20 },
    { topic: "Biochemistry", percentage: 15 },
    { topic: "Pathology", percentage: 25 },
    { topic: "Pharmacology", percentage: 15 },
    { topic: "Microbiology", percentage: 10 }
  ],
  "NEET": [
    { topic: "Physics", percentage: 25 },
    { topic: "Chemistry", percentage: 25 },
    { topic: "Biology", percentage: 25 },
    { topic: "Zoology", percentage: 15 },
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
    { topic: "Biology", percentage: 30 },
    { topic: "Chemistry", percentage: 25 },
    { topic: "Physics", percentage: 25 },
    { topic: "Psychology", percentage: 20 }
  ],
  "NCLEX": [
    { topic: "Fundamentals", percentage: 20 },
    { topic: "Medical-Surgical", percentage: 25 },
    { topic: "Pharmacology", percentage: 15 },
    { topic: "Maternal Newborn", percentage: 15 },
    { topic: "Pediatrics", percentage: 15 },
    { topic: "Mental Health", percentage: 10 }
  ],
  "COMLEX": [
    { topic: "Osteopathic Principles", percentage: 15 },
    { topic: "Anatomy", percentage: 15 },
    { topic: "Microbiology", percentage: 15 },
    { topic: "Pathology", percentage: 20 },
    { topic: "Pharmacology", percentage: 15 },
    { topic: "Clinical Applications", percentage: 20 }
  ]
};

// Colors for the chart
const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F",
  "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57", "#83a6ed", "#8dd1e1"
];

const TopicDistributionAnalysis: React.FC<TopicDistributionProps> = ({ selectedExam, tests }) => {
  // Calculate user's study distribution
  const userDistribution = useMemo(() => {
    // Return empty array if no exam selected or no tests
    if (!selectedExam || tests.length === 0) return [];

    // Count completed tests by subject
    // const completedTests = tests.filter(test => test.completed);
    const completedTests = tests;
    const subjectCounts: Record<string, number> = {};
    let totalCompletedTests = 0;

    completedTests.forEach(test => {
      const subject = test.subjectName;
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      totalCompletedTests++;
    });

    // If no completed tests, return empty array
    if (totalCompletedTests === 0) return [];

    // Convert to percentages
    return Object.entries(subjectCounts).map(([topic, count]) => ({
      topic,
      percentage: Math.round((count / totalCompletedTests) * 100)
    }));
  }, [selectedExam, tests]);

  // Get blueprint data for the selected exam
  const blueprintData = useMemo(() => {
    return selectedExam ? examBlueprints[selectedExam] || [] : [];
  }, [selectedExam]);

  // Prepare combined data for bar chart comparison
  const combinedData = useMemo(() => {
    // Return empty array if no exam selected
    if (!selectedExam) return [];

    // Create a set of all topics from both distributions
    const allTopics = new Set<string>();
    blueprintData.forEach(item => allTopics.add(item.topic));
    userDistribution.forEach(item => allTopics.add(item.topic));

    // Create combined data for each topic
    return Array.from(allTopics).map(topic => {
      const blueprint = blueprintData.find(item => item.topic === topic);
      const user = userDistribution.find(item => item.topic === topic);

      return {
        topic,
        blueprint: blueprint ? blueprint.percentage : 0,
        user: user ? user.percentage : 0
      };
    });
  }, [selectedExam, blueprintData, userDistribution]);

  // If no exam selected or no data, show a message
  if (!selectedExam) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
        <ChartArea size={48} className="mx-auto mb-2 text-blue-500" />
        <h2 className="text-xl font-semibold mb-2">Topic Distribution Analysis</h2>
        <p className="text-gray-600">
          Please select an exam to view topic distribution analysis.
        </p>
      </div>
    );
  }

  // If no completed tests, show a message
  if (userDistribution.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Topic Distribution Analysis</h2>
        <div className="text-center py-4">
          <ChartArea size={48} className="mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600">
            Complete some tests to see how your study pattern compares to the official {selectedExam} blueprint.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Topic Distribution Analysis</h2>

      <div className="text-sm text-gray-600 mb-6">
        <p>Compare your study focus with the official {selectedExam} exam blueprint. This visualization helps you identify areas that may need more attention.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Comparison */}
        <div className="h-80">
          <h3 className="font-medium text-gray-800 mb-2">Bar Chart Comparison</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={combinedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" angle={-45} textAnchor="end" height={60} />
              <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="blueprint" name="Exam Blueprint" fill="#8884d8" />
              <Bar dataKey="user" name="Your Study Pattern" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Blueprint Pie Chart */}
          <div>
            <h3 className="font-medium text-gray-800 mb-2 text-center">Exam Blueprint</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={blueprintData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="topic"
                  >
                    {blueprintData.map((entry, index) => (
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
            <h3 className="font-medium text-gray-800 mb-2 text-center">Your Study Pattern</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#82ca9d"
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

      {/* Analysis and Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Study Focus Analysis</h3>
        <div className="text-sm text-blue-800">
          {combinedData.map(item => {
            const diff = item.user - item.blueprint;
            if (Math.abs(diff) < 5) return null; // Skip if difference is small

            return (
              <p key={item.topic} className="mb-1">
                <span className="font-medium">{item.topic}:</span> {diff > 0
                  ? `You've spent ${diff}% more time than recommended.`
                  : `Needs ${Math.abs(diff)}% more focus based on exam blueprint.`}
              </p>
            );
          })}
          {combinedData.every(item => Math.abs(item.user - item.blueprint) < 5) && (
            <p>Your study pattern is well aligned with the exam blueprint. Keep up the good work!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicDistributionAnalysis;