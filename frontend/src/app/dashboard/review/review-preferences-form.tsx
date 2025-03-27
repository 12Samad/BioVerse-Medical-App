"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import axios from "axios"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { TimePickerInput } from "./time-picker-input"

// Define days of the week as a type
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Define the intervals structure
interface ReviewIntervals {
    stage1: number; // hours
    stage2: number; // days
    stage3: number; // days
}

// Define the main preferences interface
interface ReviewPreferences {
    preferredTime: string;
    preferredDays: DayOfWeek[];
    maxReviewsPerDay: number;
    notificationsEnabled: boolean;
    customIntervals: boolean;
    intervals: ReviewIntervals;
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com";

export function ReviewPreferencesForm() {
    // Initialize state with default preferences
    const [preferences, setPreferences] = useState<ReviewPreferences>({
        preferredTime: "09:00",
        preferredDays: ["monday", "wednesday", "friday"],
        maxReviewsPerDay: 10,
        notificationsEnabled: true,
        customIntervals: false,
        intervals: {
            stage1: 24, // hours
            stage2: 7, // days
            stage3: 30, // days
        },
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const userId = localStorage.getItem("Medical_User_Id");

            if (!userId) {
                setError("User ID not found. Please log in again.");
                setLoading(false);
                toast.error("Authentication required");
                return;
            }

            const response = await axios.get<ReviewPreferences>(
                `${API_BASE_URL}/api/reviews/preferences?userId=${userId}`
            );

            // Validate the response data
            const data = response.data;
            if (!data || typeof data !== 'object') {
                throw new Error("Invalid response data");
            }

            setPreferences(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load preferences:", error);
            toast.error("Failed to load preferences");
            setLoading(false);
            setError("Failed to load preferences. Please try again.");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            const userId = localStorage.getItem("Medical_User_Id");

            if (!userId) {
                setError("User ID not found. Please log in again.");
                setSaving(false);
                toast.error("Authentication required");
                return;
            }

            await axios.post(
                `${API_BASE_URL}/api/reviews/preferences?userId=${userId}`,
                preferences
            );

            toast.success("Preferences saved successfully");
            setSaving(false);
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast.error("Failed to save preferences");
            setSaving(false);
            setError("Failed to save preferences. Please try again.");
        }
    };

    const handleChange = <K extends keyof ReviewPreferences>(
        field: K,
        value: ReviewPreferences[K]
    ): void => {
        setPreferences((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleIntervalChange = (
        stage: keyof ReviewIntervals,
        value: string
    ): void => {
        setPreferences((prev) => ({
            ...prev,
            intervals: {
                ...prev.intervals,
                [stage]: Number.parseInt(value) || 0,
            },
        }));
    };

    // If still loading, show a loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If there's an error that prevents the form from being used
    if (error && !preferences) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchPreferences}>Try Again</Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <Label htmlFor="preferredTime">Preferred Review Time</Label>
                    <TimePickerInput
                        id="preferredTime"
                        value={preferences.preferredTime}
                        onChange={(value) => handleChange("preferredTime", value)}
                    />
                </div>

                <div>
                    <Label htmlFor="maxReviewsPerDay">Maximum Reviews Per Day</Label>
                    <Input
                        id="maxReviewsPerDay"
                        type="number"
                        min={1}
                        max={50}
                        value={preferences.maxReviewsPerDay}
                        onChange={(e) => handleChange(
                            "maxReviewsPerDay",
                            Math.min(50, Math.max(1, parseInt(e.target.value) || 1))
                        )}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="notificationsEnabled"
                        checked={preferences.notificationsEnabled}
                        onCheckedChange={(checked) => handleChange("notificationsEnabled", checked)}
                    />
                    <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="customIntervals"
                        checked={preferences.customIntervals}
                        onCheckedChange={(checked) => handleChange("customIntervals", checked)}
                    />
                    <Label htmlFor="customIntervals">Use Custom Intervals</Label>
                </div>

                {preferences.customIntervals && (
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-medium">Custom Spaced Repetition Intervals</h3>

                        <div>
                            <Label htmlFor="stage1">Stage 1 (hours)</Label>
                            <Input
                                id="stage1"
                                type="number"
                                min={1}
                                max={72}
                                value={preferences.intervals.stage1}
                                onChange={(e) => handleIntervalChange("stage1", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Initial review interval (1-72 hours)
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="stage2">Stage 2 (days)</Label>
                            <Input
                                id="stage2"
                                type="number"
                                min={1}
                                max={14}
                                value={preferences.intervals.stage2}
                                onChange={(e) => handleIntervalChange("stage2", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Second review interval (1-14 days)
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="stage3">Stage 3 (days)</Label>
                            <Input
                                id="stage3"
                                type="number"
                                min={15}
                                max={90}
                                value={preferences.intervals.stage3}
                                onChange={(e) => handleIntervalChange("stage3", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Final review interval (15-90 days)
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
            </Button>
        </form>
    );
}

export default ReviewPreferencesForm;