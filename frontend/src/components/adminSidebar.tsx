"use client"

import { BookMarked, BookOpen, Dna, GraduationCap, Home, Info, LaptopMinimalCheck, LogOut, Settings, Trophy, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarItems = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Manage Subjects", href: "/admin/manage-subjects", icon: Settings },
    { name: "Create Questions", href: "/admin/create-test", icon: BookOpen },
    { name: "Flash Cards", href: "/admin/flash-cards", icon: BookMarked },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Leaderboard", href: "/admin/leaderboard-management", icon: Trophy },
    { name: "Inquiries", href: "/admin/inquiries", icon: Info },
    { name: "Courses", href: "/admin/courses", icon: LaptopMinimalCheck },
    { name: "Mentors", href: "/admin/mentor", icon: GraduationCap }
    // { name: "Leaderboard", href: "/admin/leaderboard", icon: PiRankingDuotone },
    // { name: "Performance Tracking", href: "/admin/performance-tracking", icon: BarChart2 },
    // { name: "Smart Study Calendar", href: "/admin/smart-study", icon: BookOpen },
    // { name: "Custom Weekly Goals", href: "/admin/custom-weekly-goals", icon: Settings },
    // { name: "Pomodoro Timer", href: "/admin/pomodoro-timer", icon: Clock },
]

interface SidebarProps {
    isOpen: boolean
    toggleSidebar: () => void
}

const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.clear()
        window.location.href = "/login";
    }
};

export function AdminSidebar({ isOpen, toggleSidebar }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div
            className={`bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"
                } md:relative md:translate-x-0 transition duration-200 ease-in-out z-30`}
        >
            <div className="flex justify-between items-center px-4 md:hidden">
                <span className="font-semibold text-xl">Menu</span>
                <button onClick={toggleSidebar} className="text-sky-900 hover:text-sky-700">
                    <X className="h-6 w-6" />
                </button>
            </div>
            <div className="flex flex-col items-center mb-6">
                <div className="bg-sky-600 p-3 rounded-full">
                    <Dna className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-emerald-800 mt-3">BioVerse</h1>
            </div>
            <nav>
                <ul className="space-y-2">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center space-x-2 px-4 py-3 rounded transition-colors duration-200 ${isActive ? "bg-sky-300 text-sky-800 font-medium" : "hover:bg-sky-50 hover:text-sky-700"
                                        }`}
                                    onClick={() => {
                                        if (window.innerWidth < 768) {
                                            toggleSidebar()
                                        }
                                    }}
                                >
                                    <item.icon className={`h-5 w-5 ${isActive ? "text-sky-600" : "text-sky-500"}`} />
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        )
                    })}

                </ul>
                <button
                    className="flex items-center space-x-2 px-4 py-3 rounded transition-colors duration-200 hover:bg-red-100 text-red-600 w-full"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5 text-red-600" />
                    <span>Logout</span>
                </button>
            </nav>
        </div>
    )
}

