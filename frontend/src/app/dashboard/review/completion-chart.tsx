"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Define types for completion data
interface CompletionDataPoint {
    label: string;
    completionRate: number;
    date: string;
}

interface CompletionStats {
    daily: CompletionDataPoint[];
    weekly: CompletionDataPoint[];
    monthly: CompletionDataPoint[];
}

interface ChartRendererProps {
    data: CompletionDataPoint[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com";

export function CompletionChart() {
    const [chartData, setChartData] = useState<CompletionStats>({
        daily: [],
        weekly: [],
        monthly: [],
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, []);

    const fetchChartData = async () => {
        try {
            const userId = localStorage.getItem("Medical_User_Id");

            if (!userId) {
                setError("User ID not found. Please log in again.");
                setLoading(false);
                toast.error("Authentication required");
                return;
            }

            setLoading(true);
            setError(null);

            const response = await axios.get<CompletionStats>(
                `${API_BASE_URL}/api/reviews/completion-stats?userId=${userId}`
            );

            // Ensure data has expected format
            const { daily, weekly, monthly } = response.data;

            if (!Array.isArray(daily) || !Array.isArray(weekly) || !Array.isArray(monthly)) {
                throw new Error("Invalid data format received from server");
            }

            setChartData(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load chart data:", error);
            setError("Failed to load chart data. Please try again later.");
            setLoading(false);
            toast.error("Failed to load chart data");
        }
    };

    if (loading) {
        return (
            <Card className="p-4">
                <div className="h-64 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Loading chart data...</p>
                    </div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-4">
                <div className="h-64 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={fetchChartData}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Tabs defaultValue="daily">
            <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-2">Daily Completion Rate</h3>
                    <div className="h-64">
                        <ChartRenderer data={chartData.daily} />
                    </div>
                </Card>
            </TabsContent>
            <TabsContent value="weekly">
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-2">Weekly Completion Rate</h3>
                    <div className="h-64">
                        <ChartRenderer data={chartData.weekly} />
                    </div>
                </Card>
            </TabsContent>
            <TabsContent value="monthly">
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-2">Monthly Completion Rate</h3>
                    <div className="h-64">
                        <ChartRenderer data={chartData.monthly} />
                    </div>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

function ChartRenderer({ data }: ChartRendererProps) {
    // If using recharts (recommended)
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis
                    domain={[0, 100]}
                    tickCount={6}
                    tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                    labelFormatter={(label) => `${label}`}
                />
                <Bar
                    dataKey="completionRate"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                />
            </BarChart>
        </ResponsiveContainer>
    );

    // Fallback to simple bars if you don't want to use a charting library
    /*
    return (
        <div className="h-full flex flex-col justify-end">
            <div className="flex h-full items-end gap-2">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1">
                        <div
                            className="bg-primary/80 w-full rounded-t-md"
                            style={{ height: `${(item.completionRate / 100) * 100}%` }}
                        ></div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs">{item.label}</span>
                            <span className="text-xs font-medium">{item.completionRate}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    */
}

export default CompletionChart;