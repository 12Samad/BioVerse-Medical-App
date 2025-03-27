"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, FileText, GraduationCap, Info, Target } from 'lucide-react'
import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
// import axios from "axios"

interface TopicData {
  name: string
  attempts: number
  correct: number
  incorrect: number
  averageTime: number
  totalTime: number
  masteryLevel: string
  masteryScore: number
  lastAttemptDate: string | null
  isQuestPriority?: boolean
}

interface TopicMasteryMetrics {
  topics: TopicData[]
  systems: {
    name: string
    attempts: number
    correct: number
    incorrect: number
    masteryLevel: string
    masteryScore: number
  }[]
  subtopics: {
    name: string
    parentTopic: string
    attempts: number
    correct: number
    incorrect: number
    masteryLevel: string
    masteryScore: number
  }[]
  weakestTopics: {
    name: string
    masteryScore: number
    masteryLevel: string
    isQuestPriority?: boolean
  }[]
  strongestTopics: {
    name: string
    masteryScore: number
    masteryLevel: string
  }[]
  overallMastery: {
    averageScore: number
    topicsStarted: number
    topicsAtExpert: number
    topicsNeedingWork: number
  }
}

interface ExamSection {
  id: string
  name: string
  weight: number
  topics: string[]
  requiredScore: number
}

interface ExamBlueprint {
  id: string
  name: string
  sections: ExamSection[]
  passingScore: number
  description: string
}

interface SectionAlignment {
  sectionId: string
  name: string
  weight: number
  coveragePercentage: number
  averageScore: number
  alignmentPercentage: number
  requiredScore: number
  scoreGap: number
  status: "excellent" | "good" | "needs-work" | "critical"
  topics: number
  coveredTopics: number
  matchedTopics: TopicData[]
}

interface ExamAlignmentProps {
  topicMasteryData: TopicMasteryMetrics | null
  targetExam?: string | null
  isLoading?: boolean
  className?: string
}

export default function ExamAlignment({
  topicMasteryData,
  targetExam = null,
  isLoading = false,
  className = "",
}: ExamAlignmentProps) {
  const [selectedExam, setSelectedExam] = useState<string | null>(targetExam || null)
  const [examBlueprints, setExamBlueprints] = useState<ExamBlueprint[]>([])
  const [currentBlueprint, setCurrentBlueprint] = useState<ExamBlueprint | null>(null)
  const [sectionAlignments, setSectionAlignments] = useState<SectionAlignment[]>([])
  const [overallAlignment, setOverallAlignment] = useState<number>(0)
  const [loadingBlueprints, setLoadingBlueprints] = useState<boolean>(true)

  // Fetch exam blueprints from API
  useEffect(() => {
    const fetchExamBlueprints = async () => {
      setLoadingBlueprints(true)
      try {
        // In a real implementation, this would be an API call
        // For demo purposes, we'll simulate an API response
        // const response = await axios.get('/api/exam-blueprints')
        // const data = response.data
        
        // Simulated API response
        const data = [
          {
            id: "usmle-step1",
            name: "USMLE Step 1",
            sections: [
              {
                id: "biochem",
                name: "Biochemistry & Molecular Biology",
                weight: 15,
                topics: ["Biochemistry", "Molecular Biology", "Genetics", "Nutrition"],
                requiredScore: 65
              },
              {
                id: "immuno",
                name: "Immunology & Microbiology",
                weight: 15,
                topics: ["Immunology", "Microbiology", "Infectious Disease"],
                requiredScore: 65
              },
              {
                id: "pathology",
                name: "Pathology",
                weight: 15,
                topics: ["Pathology", "Inflammation", "Neoplasia"],
                requiredScore: 70
              },
              {
                id: "pharma",
                name: "Pharmacology",
                weight: 15,
                topics: ["Pharmacology", "Toxicology", "Drug Mechanisms"],
                requiredScore: 65
              },
              {
                id: "physio",
                name: "Physiology",
                weight: 15,
                topics: ["Physiology", "Cardiovascular", "Respiratory", "Renal", "Gastrointestinal", "Endocrine"],
                requiredScore: 70
              },
              {
                id: "behavioral",
                name: "Behavioral Sciences",
                weight: 10,
                topics: ["Psychiatry", "Psychology", "Biostatistics", "Ethics"],
                requiredScore: 60
              },
              {
                id: "anatomy",
                name: "Anatomy & Embryology",
                weight: 15,
                topics: ["Anatomy", "Embryology", "Histology"],
                requiredScore: 65
              }
            ],
            passingScore: 60,
            description: "Focuses on basic science concepts relevant to medicine"
          },
          {
            id: "usmle-step2",
            name: "USMLE Step 2 CK",
            sections: [
              {
                id: "internal",
                name: "Internal Medicine",
                weight: 20,
                topics: ["Cardiovascular", "Respiratory", "Gastrointestinal", "Renal", "Endocrine", "Hematology"],
                requiredScore: 70
              },
              {
                id: "surgery",
                name: "Surgery",
                weight: 15,
                topics: ["Surgery", "Trauma", "Orthopedics", "Anesthesiology"],
                requiredScore: 65
              },
              {
                id: "peds",
                name: "Pediatrics",
                weight: 15,
                topics: ["Pediatrics", "Congenital Disorders", "Child Development"],
                requiredScore: 70
              },
              {
                id: "obgyn",
                name: "Obstetrics & Gynecology",
                weight: 15,
                topics: ["Obstetrics", "Gynecology", "Reproductive Health"],
                requiredScore: 65
              },
              {
                id: "psych",
                name: "Psychiatry",
                weight: 10,
                topics: ["Psychiatry", "Behavioral Health", "Substance Abuse"],
                requiredScore: 65
              },
              {
                id: "emergency",
                name: "Emergency Medicine",
                weight: 10,
                topics: ["Emergency Medicine", "Toxicology", "Critical Care"],
                requiredScore: 70
              },
              {
                id: "preventive",
                name: "Preventive Medicine",
                weight: 15,
                topics: ["Preventive Medicine", "Public Health", "Biostatistics", "Ethics"],
                requiredScore: 60
              }
            ],
            passingScore: 60,
            description: "Focuses on clinical knowledge and application in patient care"
          },
          {
            id: "enare",
            name: "ENARE 2025",
            sections: [
              {
                id: "medicina",
                name: "Medicina Interna",
                weight: 20,
                topics: ["Cardiovascular", "Respiratory", "Gastrointestinal", "Endocrine", "Infectious Disease"],
                requiredScore: 70
              },
              {
                id: "cirugia",
                name: "Cirugía",
                weight: 15,
                topics: ["Surgery", "Orthopedics", "Trauma"],
                requiredScore: 65
              },
              {
                id: "pediatria",
                name: "Pediatría",
                weight: 15,
                topics: ["Pediatrics", "Child Development", "Neonatology"],
                requiredScore: 70
              },
              {
                id: "gineco",
                name: "Ginecología y Obstetricia",
                weight: 15,
                topics: ["Obstetrics", "Gynecology", "Reproductive Health"],
                requiredScore: 65
              },
              {
                id: "urgencias",
                name: "Urgencias",
                weight: 15,
                topics: ["Emergency Medicine", "Critical Care", "Toxicology"],
                requiredScore: 70
              },
              {
                id: "salud",
                name: "Salud Pública",
                weight: 10,
                topics: ["Public Health", "Epidemiology", "Biostatistics"],
                requiredScore: 60
              },
              {
                id: "basicas",
                name: "Ciencias Básicas",
                weight: 10,
                topics: ["Anatomy", "Physiology", "Pharmacology", "Pathology"],
                requiredScore: 65
              }
            ],
            passingScore: 60,
            description: "Examen Nacional de Aspirantes a Residencias Médicas en México"
          },
          {
            id: "mccqe",
            name: "MCCQE Part I",
            sections: [
              {
                id: "health-promotion",
                name: "Health Promotion & Illness Prevention",
                weight: 15,
                topics: ["Preventive Medicine", "Public Health", "Epidemiology"],
                requiredScore: 65
              },
              {
                id: "conditions",
                name: "Acute & Chronic Conditions",
                weight: 25,
                topics: ["Internal Medicine", "Surgery", "Emergency Medicine", "Chronic Disease Management"],
                requiredScore: 70
              },
              {
                id: "maternal",
                name: "Maternal & Child Health",
                weight: 15,
                topics: ["Obstetrics", "Gynecology", "Pediatrics", "Neonatology"],
                requiredScore: 65
              },
              {
                id: "mental",
                name: "Mental Health & Behavioral Conditions",
                weight: 15,
                topics: ["Psychiatry", "Psychology", "Substance Abuse"],
                requiredScore: 65
              },
              {
                id: "population",
                name: "Population Health & Ethics",
                weight: 15,
                topics: ["Public Health", "Ethics", "Medical-Legal Issues", "Healthcare Systems"],
                requiredScore: 60
              },
              {
                id: "decision",
                name: "Clinical Decision Making",
                weight: 15,
                topics: ["Diagnosis", "Investigation", "Management", "Clinical Reasoning"],
                requiredScore: 70
              }
            ],
            passingScore: 60,
            description: "Medical Council of Canada Qualifying Examination"
          },
          {
            id: "plab",
            name: "PLAB 1",
            sections: [
              {
                id: "clinical",
                name: "Clinical Sciences",
                weight: 70,
                topics: ["Medicine", "Surgery", "Pediatrics", "Obstetrics", "Gynecology", "Psychiatry"],
                requiredScore: 65
              },
              {
                id: "application",
                name: "Clinical Application",
                weight: 20,
                topics: ["Diagnosis", "Investigation", "Management", "Emergency Care"],
                requiredScore: 70
              },
              {
                id: "professional",
                name: "Professional Skills",
                weight: 10,
                topics: ["Ethics", "Communication", "Legal Issues", "Patient Safety"],
                requiredScore: 60
              }
            ],
            passingScore: 60,
            description: "Professional and Linguistic Assessments Board exam for the UK"
          }
        ];
        
        setExamBlueprints(data);
        
        // Set default exam if none is selected
        if (!selectedExam && data.length > 0) {
          setSelectedExam(data[0].id);
          setCurrentBlueprint(data[0]);
        } else if (selectedExam) {
          const selected = data.find(exam => exam.id === selectedExam);
          if (selected) {
            setCurrentBlueprint(selected);
          }
        }
      } catch (error) {
        console.error("Error fetching exam blueprints:", error);
      } finally {
        setLoadingBlueprints(false);
      }
    };

    fetchExamBlueprints();
  }, [selectedExam]);

  // Update current blueprint when selected exam changes
  useEffect(() => {
    if (selectedExam && examBlueprints.length > 0) {
      const selected = examBlueprints.find(exam => exam.id === selectedExam);
      if (selected) {
        setCurrentBlueprint(selected);
      }
    }
  }, [selectedExam, examBlueprints]);

  // Calculate alignment scores when topic mastery data or current blueprint changes
  useEffect(() => {
    if (!topicMasteryData || !currentBlueprint) return;

    // Calculate section alignments
    const alignments = currentBlueprint.sections.map(section => {
      // Find topics in the user's mastery data that match the section topics
      const matchedTopics = topicMasteryData.topics.filter(topic => 
        section.topics.some(sectionTopic => 
          topic.name.toLowerCase().includes(sectionTopic.toLowerCase()) ||
          sectionTopic.toLowerCase().includes(topic.name.toLowerCase())
        )
      );

      // Calculate coverage (how many topics the user has attempted)
      const totalTopics = section.topics.length;
      const coveredTopics = matchedTopics.filter(topic => topic.attempts > 0).length;
      const coveragePercentage = totalTopics > 0 ? (coveredTopics / totalTopics) * 100 : 0;

      // Calculate average mastery score for this section
      const totalScore = matchedTopics.reduce((sum, topic) => sum + topic.masteryScore, 0);
      const averageScore = matchedTopics.length > 0 ? totalScore / matchedTopics.length : 0;

      // Calculate alignment (how close the user's score is to the required score)
      const alignmentPercentage = section.requiredScore > 0 
        ? Math.min(100, (averageScore / section.requiredScore) * 100) 
        : 0;

      // Calculate gap to required score
      const scoreGap = Math.max(0, section.requiredScore - averageScore);

      // Determine status based on alignment
      let status: "excellent" | "good" | "needs-work" | "critical";
      if (alignmentPercentage >= 100) {
        status = "excellent";
      } else if (alignmentPercentage >= 80) {
        status = "good";
      } else if (alignmentPercentage >= 60) {
        status = "needs-work";
      } else {
        status = "critical";
      }

      return {
        sectionId: section.id,
        name: section.name,
        weight: section.weight,
        coveragePercentage,
        averageScore,
        alignmentPercentage,
        requiredScore: section.requiredScore,
        scoreGap,
        status,
        topics: totalTopics,
        coveredTopics,
        matchedTopics
      };
    });

    setSectionAlignments(alignments);

    // Calculate overall alignment
    if (alignments.length > 0) {
      const weightedSum = alignments.reduce(
        (sum, section) => sum + (section.alignmentPercentage * section.weight), 
        0
      );
      
      const totalWeight = alignments.reduce((sum, section) => sum + section.weight, 0);
      
      const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
      setOverallAlignment(overall);
    } else {
      setOverallAlignment(0);
    }
  }, [topicMasteryData, currentBlueprint]);

  // Prepare data for the radial chart
  const chartData = sectionAlignments.map(section => ({
    name: section.name,
    value: section.alignmentPercentage,
    fill: section.status === "excellent" 
      ? "#10b981" 
      : section.status === "good" 
        ? "#3b82f6" 
        : section.status === "needs-work" 
          ? "#f59e0b" 
          : "#ef4444"
  }));

  // Prepare data for the pie chart
  const pieData = [
    { name: "Aligned", value: overallAlignment, fill: "#3b82f6" },
    { name: "Gap", value: 100 - overallAlignment, fill: "#e5e7eb" }
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 dark:text-green-400";
      case "good": return "text-blue-600 dark:text-blue-400";
      case "needs-work": return "text-yellow-600 dark:text-yellow-400";
      case "critical": return "text-red-600 dark:text-red-400";
      default: return "text-muted-foreground";
    }
  };

  // Get status background color
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "excellent": return "bg-green-100 dark:bg-green-900/20";
      case "good": return "bg-blue-100 dark:bg-blue-900/20";
      case "needs-work": return "bg-yellow-100 dark:bg-yellow-900/20";
      case "critical": return "bg-red-100 dark:bg-red-900/20";
      default: return "bg-muted";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle2 className="h-4 w-4" />;
      case "good": return <CheckCircle2 className="h-4 w-4" />;
      case "needs-work": return <AlertTriangle className="h-4 w-4" />;
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Get overall status
  const getOverallStatus = () => {
    if (overallAlignment >= 90) return "excellent";
    if (overallAlignment >= 75) return "good";
    if (overallAlignment >= 60) return "needs-work";
    return "critical";
  };

  // Get overall status message
  const getOverallStatusMessage = () => {
    const status = getOverallStatus();
    switch (status) {
      case "excellent": 
        return "Your preparation is well-aligned with exam requirements. Keep up the good work!";
      case "good": 
        return "You're on the right track. Focus on improving your weaker sections.";
      case "needs-work": 
        return "You need more focused preparation in several key areas.";
      case "critical": 
        return "Significant improvement needed in most exam areas. Consider a structured study plan.";
      default: 
        return "Start preparing for your target exam by focusing on high-yield topics.";
    }
  };

  if (isLoading || loadingBlueprints) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Exam Alignment</CardTitle>
          <CardDescription>Loading your exam alignment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topicMasteryData || !currentBlueprint) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Exam Alignment</CardTitle>
          <CardDescription>Track your readiness for specific medical exams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No topic mastery data available</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Complete more tests to see how your performance aligns with your target exam requirements
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Exam Alignment
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <p>
                        This shows how well your current performance aligns with the requirements of your target exam.
                        Higher alignment means you&apos;re better prepared for that specific exam.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Track your readiness for specific medical exams
              </CardDescription>
            </div>
            <Select value={selectedExam || undefined} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {examBlueprints.map(exam => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Alignment Card */}
            <div className="md:col-span-1">
              <div className="bg-muted/30 p-4 rounded-lg h-full">
                <h3 className="text-sm font-medium mb-4">Overall Alignment</h3>
                
                <div className="flex justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={48}
                          paddingAngle={0}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold">{Math.round(overallAlignment)}%</span>
                      <span className="text-xs text-muted-foreground">Aligned</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${getStatusBgColor(getOverallStatus())} mb-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={getStatusColor(getOverallStatus())}>
                      {getStatusIcon(getOverallStatus())}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(getOverallStatus())}`}>
                      {getOverallStatus() === "excellent" ? "Excellent" : 
                       getOverallStatus() === "good" ? "Good Progress" : 
                       getOverallStatus() === "needs-work" ? "Needs Work" : 
                       "Needs Significant Work"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{getOverallStatusMessage()}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{currentBlueprint.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentBlueprint.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Passing score: <span className="font-medium">{currentBlueprint.passingScore}%</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Section Alignment Chart */}
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 h-full">
                <h3 className="text-sm font-medium mb-4">Section Alignment</h3>
                
                <div className="h-[200px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="20%" 
                      outerRadius="90%" 
                      barSize={10} 
                      data={chartData}
                      startAngle={180}
                      endAngle={-180}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        label={{ position: 'insideStart', fill: '#888', fontSize: 10 }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [`${Math.round(value as number)}% Aligned`, "Alignment"]}
                        labelFormatter={(label) => `${label}`}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {sectionAlignments.map((section) => (
                    <div key={section.sectionId} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-full ${getStatusBgColor(section.status)}`}>
                            <span className={getStatusColor(section.status)}>
                              {getStatusIcon(section.status)}
                            </span>
                          </span>
                          <span className="text-sm font-medium">{section.name}</span>
                        </div>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {section.weight}% of exam
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Your score: {Math.round(section.averageScore)}%</span>
                        <span>Required: {section.requiredScore}%</span>
                      </div>
                      
                      <Progress 
                        value={section.alignmentPercentage} 
                        className={
                          section.status === "excellent" ? "bg-green-500" :
                          section.status === "good" ? "bg-blue-500" :
                          section.status === "needs-work" ? "bg-yellow-500" :
                          "bg-red-500"
                        }
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Coverage: {section.coveredTopics}/{section.topics} topics</span>
                        <span>{Math.round(section.alignmentPercentage)}% aligned</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button size="sm">
              View Detailed Exam Blueprint
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
