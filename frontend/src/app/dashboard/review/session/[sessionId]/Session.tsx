"use client"
import { useParams } from "next/navigation"
import ReviewSession from "../../review-session"

export default function ReviewSessionPage() {
    const { sessionId } = useParams()

    return <ReviewSession params={Array.isArray(sessionId) ? sessionId[0] : sessionId} />
}

