"use client"

import { Banknote, BarChart2, BookOpen, BotIcon, Clock, Dna, FileQuestion, GraduationCap, Home, Info, LaptopMinimalCheck, ScanSearch, Settings, Users, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PiRankingDuotone } from "react-icons/pi"

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Create Test", href: "/dashboard/create-test", icon: BookOpen },
  { name: "Flash Cards", href: "/dashboard/flash-cards", icon: Users },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: PiRankingDuotone },
  { name: "Performance Tracking", href: "/dashboard/performance-tracking", icon: BarChart2 },
  { name: "Smart Study Calendar", href: "/dashboard/smart-study", icon: BookOpen },
  { name: "Custom Weekly Goals", href: "/dashboard/custom-weekly-goals", icon: Settings },
  // { name: "Digital Error Notebook", href: "/dashboard/digital-error-notebook", icon: Users },
  { name: "Pomodoro Timer", href: "/dashboard/pomodoro-timer", icon: Clock },
  { name: "Payments", icon: Banknote, href: "/dashboard/payments", color: "bg-blue-500" },
  { name: "Reviews", icon: ScanSearch, href: "/dashboard/review", color: "bg-blue-500" },
  { name: "Inquiries", icon: Info, href: "/dashboard/inquiries", color: "bg-blue-500" },
  { name: "Courses", icon: LaptopMinimalCheck, href: "/dashboard/courses", color: "bg-blue-500" },
  { name: "Mentor", icon: GraduationCap, href: "/dashboard/mentor", color: "bg-blue-500" },
  { name: "FAQs", icon: FileQuestion, href: "/dashboard/faqs", color: "bg-blue-500" },
  { name: "AI Study Planner", icon: BotIcon, href: "/dashboard/study-planner", color: "bg-blue-500" },
  // { name: "Booking", icon: BookOpen, href: "/dashboard/booking", color: "bg-blue-500" },
  // { name: "Mentorship", icon: BookOpen, href: "/dashboard/mentorship", color: "bg-blue-500" },
]

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
}

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className={`bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 w-72 h-screen fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 flex flex-col`}
    >
      <div className="flex-shrink-0 p-4">
        <div className="flex justify-between items-center md:hidden">
          <span className="font-semibold text-xl">Menu</span>
          <button onClick={toggleSidebar} className="text-sky-900 hover:text-sky-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col items-center mt-6 mb-6">
          <div className="bg-sky-600 p-3 rounded-full">
            <Dna className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-800 mt-3">BioVerse</h1>
        </div>
      </div>
      <nav className="flex-grow overflow-y-auto scrollbar-thin">
        <ul className="space-y-2 px-2 pb-4">
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
      </nav>
    </div>
  )
}

