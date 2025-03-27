"use client"

import { Button } from "@/components/ui/button"
import axios from "axios"
import { Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function ChallengeButton() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const startChallenge = async () => {
        setIsLoading(true)

        try {
            // Get user ID from local storage
            const userId = localStorage.getItem("Medical_User_Id")

            if (!userId) {
                toast.error("Please log in to start a challenge")
                return
            }

            // Start a new challenge session
            const response = await axios.post(
                `https://medical-backend-loj4.onrender.com/api/challenge/start?userId=${userId}`,
                { questionCount: 10 }
            )

            if (response.data.success) {
                // Navigate to the challenge page with the session ID
                router.push(`/dashboard/challenge/${response.data.sessionId}`)
            } else {
                toast.error(response.data.message || "Please try again later")
            }
        } catch (error) {
            console.error("Error starting challenge:", error)
            toast.error("Failed to start challenge. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button onClick={startChallenge} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Trophy className="mr-2 h-4 w-4" />
            Challenge me
        </Button>
    )
}

