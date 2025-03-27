"use client"

import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface Review {
    _id: string;
    title: string;
    type: "daily" | "other";
    scheduledFor: string;
    stage: number;
}

export function UpcomingReviews({ reviews = [] }: { reviews: Review[] }) {

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming reviews</h3>
                <p className="text-sm text-muted-foreground mt-2">You don&apos;t have any scheduled review sessions yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                            {review.type === "daily" ? (
                                <Clock className="h-5 w-5 text-primary" />
                            ) : (
                                <Calendar className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium">{review.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-muted-foreground">{new Date(review.scheduledFor).toLocaleString()}</p>
                                <Badge variant={getReviewStageBadgeVariant(review.stage)}>Stage {review.stage}</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function getReviewStageBadgeVariant(stage: number) {
    switch (stage) {
        case 1:
            return "default"
        case 2:
            return "secondary"
        case 3:
            return "outline"
        default:
            return "default"
    }
}

