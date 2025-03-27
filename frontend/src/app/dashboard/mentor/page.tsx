import { Suspense } from "react";
import MentorDetailPage from "./Mentor";

export default function page() {
    return (
        <Suspense fallback="Loading...">
            <MentorDetailPage />
        </Suspense>
    )
}
