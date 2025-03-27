"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import axios from "axios"
import { motion } from "framer-motion"
import { Calendar, Flame, Sparkles, Trophy } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import DailyChallengeModal from "./daily-challenge-modal"

export default function DailyChallengeButton({ variant = "default" }: { variant?: "default" | "dashboard" }) {
    const [showModal, setShowModal] = useState(false)
    const [hasNewChallenge, setHasNewChallenge] = useState(false)
    const [streakCount, setStreakCount] = useState(0)
    const { status } = useSession()

    useEffect(() => {
        const checkDailyChallenge = async () => {
            try {
                const userId = localStorage.getItem("Medical_User_Id")
                const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/daily-challenge?userId=${userId}`)
                const data = response.data

                if (response.status === 200) {
                    // If there's a challenge and it's not completed, show notification
                    setHasNewChallenge(!data.completed)

                    // Get streak from localStorage or API
                    const streak = localStorage.getItem("dailyChallengeStreak")
                        ? Number.parseInt(localStorage.getItem("dailyChallengeStreak") || "0")
                        : 0
                    setStreakCount(streak)
                }
            } catch (err) {
                console.error("Error checking daily challenge:", err)
            }
        }

        checkDailyChallenge()

        // Check for new challenges when the component mounts
        const lastCheck = localStorage.getItem("lastDailyChallengeCheck")
        const now = new Date().toDateString()

        if (lastCheck !== now) {
            localStorage.setItem("lastDailyChallengeCheck", now)
            setHasNewChallenge(true)
        }
    }, [status])

    if (variant === "dashboard") {
        return (
            <>
                <motion.div
                    className="relative w-full max-w-md mx-auto"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="absolute -top-2 -right-2 z-10">
                        {hasNewChallenge && (
                            <motion.div
                                className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 10,
                                }}
                            >
                                NEW
                            </motion.div>
                        )}
                    </div>

                    <Button
                        onClick={() => setShowModal(true)}
                        className={cn(
                            "w-full relative overflow-hidden group h-auto py-6 border-2",
                            hasNewChallenge ? "border-primary bg-primary/10 hover:bg-primary/20" : "border-muted-foreground/20",
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 group-hover:via-primary/10 transition-all duration-700 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>

                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Calendar
                                        className={cn(
                                            "h-10 w-10 transition-colors",
                                            hasNewChallenge ? "text-primary" : "text-muted-foreground",
                                        )}
                                    />
                                    {hasNewChallenge && (
                                        <motion.div
                                            className="absolute -top-1 -right-1"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                            }}
                                            transition={{
                                                repeat: Number.POSITIVE_INFINITY,
                                                duration: 2,
                                            }}
                                        >
                                            <Sparkles className="h-4 w-4 text-yellow-400" />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="text-left">
                                    <h3 className={cn("font-bold text-lg", hasNewChallenge ? "text-primary" : "text-foreground")}>
                                        Daily Challenge
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {hasNewChallenge ? "New challenge available!" : "Come back tomorrow for a new challenge"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {streakCount > 0 && (
                                    <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                                        <Flame className="h-3 w-3" />
                                        <span>{streakCount} day streak</span>
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "rounded-full p-2",
                                        hasNewChallenge ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                    )}
                                >
                                    <Trophy className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </Button>
                </motion.div>

                {showModal && <DailyChallengeModal onClose={() => setShowModal(false)} />}
            </>
        )
    }

    return (
        <>
            <Button onClick={() => setShowModal(true)} variant="outline" className="relative">
                <Calendar className="h-5 w-5 mr-2" />
                Daily Challenge
                {hasNewChallenge && <span className="animate-ping absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />}
            </Button>

            {showModal && <DailyChallengeModal onClose={() => setShowModal(false)} />}
        </>
    )
}

