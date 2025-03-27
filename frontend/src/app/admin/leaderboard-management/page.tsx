"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, BarChart3, FileBarChart, Gauge, Settings2, Users } from "lucide-react"
import { useState } from "react"
import { BadgeManagement } from "./badge-management"
import { DashboardOverview } from "./dashboard-overview"
// import { ReportsAnalytics } from "./reports-analytics"
// import { RuleBuilder } from "./rule-builder"
// import { Settings } from "./settings"
import UserProgress from "./user-progress"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview")

    return (
        <div className=" min-h-screen bg-muted/30">

            <div className="w-full flex-col bg-card border-r p-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <Award className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">Leaderboard Management</h1>
                </div>

                <nav className="space-y-1 flex items-baseline gap-2">
                    <Button
                        variant={activeTab === "overview" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("overview")}
                    >
                        <Gauge className="mr-2 h-4 w-4" />
                        Overview
                    </Button>
                    <Button
                        variant={activeTab === "badges" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("badges")}
                    >
                        <Award className="mr-2 h-4 w-4" />
                        Badge Management
                    </Button>
                    <Button
                        variant={activeTab === "users" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("users")}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        User Progress
                    </Button>
                    {/* <Button
                        variant={activeTab === "reports" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("reports")}
                    >
                        <FileBarChart className="mr-2 h-4 w-4" />
                        Reports & Analytics
                    </Button> */}
                    {/* <Button
                        variant={activeTab === "rules" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("rules")}
                    >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Rule Builder
                    </Button> */}
                    {/* <Button
                        variant={activeTab === "settings" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("settings")}
                    >
                        <Settings2 className="mr-2 h-4 w-4" />
                        Settings
                    </Button> */}
                </nav>
            </div>

            {/* Mobile navigation */}
            <div className="md:hidden w-full border-b bg-card">
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-6 w-full">
                        <TabsTrigger value="overview">
                            <Gauge className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="badges">
                            <Award className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="users">
                            <Users className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="reports">
                            <FileBarChart className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="rules">
                            <BarChart3 className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings2 className="h-4 w-4" />
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 md:p-8 overflow-auto">
                {activeTab === "overview" && <DashboardOverview />}
                {activeTab === "badges" && <BadgeManagement />}
                {activeTab === "users" && <UserProgress />}
                {/* {activeTab === "reports" && <ReportsAnalytics />} */}
                {/* {activeTab === "rules" && <RuleBuilder />} */}
                {/* {activeTab === "settings" && <Settings />} */}
            </div>
        </div>
    )
}

