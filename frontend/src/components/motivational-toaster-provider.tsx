"use client"

import { getCategoryForPath, getRandomIconForCategory, getRandomMessageForCategory } from "@/lib/motivational-messages"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

export default function MotivationalToastProvider() {
    const pathname = usePathname()
    const [previousPath, setPreviousPath] = useState<string | null>(null)
    const [isFirstLoad, setIsFirstLoad] = useState(true)

    // Show a motivational message on initial load and when path changes
    useEffect(() => {
        // Skip if it's the same path (prevents double messages on some navigations)
        if (previousPath === pathname) return

        // Update previous path
        setPreviousPath(pathname)

        // Don't show on the very first load of the app
        if (isFirstLoad) {
            setIsFirstLoad(false)
            return
        }

        // Get the appropriate message category based on the current path
        const category = getCategoryForPath(pathname)

        // Get a random message for this category
        const message = getRandomMessageForCategory(category)

        // Get a random icon for this category
        const icon = getRandomIconForCategory(category)

        // Get a color based on the category
        const borderColor = getCategoryColor(category)

        // Show the toast
        toast(message, {
            icon,
            duration: 5000,
            position: "top-center",
            style: {
                borderLeft: `4px solid ${borderColor}`,
                padding: "16px",
                maxWidth: "500px",
                backgroundColor: "#f8fafc",
                color: "#1e293b",
            },
        })

        // Log for debugging
        console.log(`Showing ${category} message for path: ${pathname}`)
    }, [pathname, previousPath, isFirstLoad])

    return (
        <>
            <Toaster position="top-center" />

            {/* Debug button - only visible in development */}
            {/* {process.env.NODE_ENV === "development" && (
                <button
                    onClick={() => {
                        const category = getCategoryForPath(pathname)
                        const message = getRandomMessageForCategory(category)
                        const icon = getRandomIconForCategory(category)

                        toast(message, {
                            icon,
                            duration: 5000,
                            position: "top-center",
                            style: {
                                borderLeft: `4px solid ${getCategoryColor(category)}`,
                                padding: "16px",
                                maxWidth: "500px",
                                backgroundColor: "#f8fafc",
                                color: "#1e293b",
                            },
                        })

                        console.log(`Manually triggered ${category} message for path: ${pathname}`)
                    }}
                    className="fixed bottom-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg z-50"
                    style={{ opacity: 0.7 }}
                >
                    Test Toast
                </button>
            )} */}
        </>
    )
}

// Function to get a color for each category
function getCategoryColor(category: string): string {
    switch (category) {
        case "study":
            return "#3b82f6" // blue
        case "performance":
            return "#10b981" // green
        case "challenge":
            return "#f59e0b" // amber
        case "productivity":
            return "#8b5cf6" // purple
        case "support":
            return "#ec4899" // pink
        case "admin":
            return "#6b7280" // gray
        default:
            return "#3b82f6" // blue (default)
    }
}

