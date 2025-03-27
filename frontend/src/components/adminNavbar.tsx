import { Bell, Menu, MessageSquare, User } from "lucide-react"
import Link from "next/link"

interface NavbarProps {
    toggleSidebar: () => void
}

export function AdminNavbar({ toggleSidebar }: NavbarProps) {
    return (
        <nav className="bg-white shadow-md border-b border-slate-200">
            <div className="min-w-[100%] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="block md:hidden">
                            <Menu onClick={toggleSidebar} className="w-8 h-8" />
                        </div>
                        <span className="font-semibold text-xl">BioVerse</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/notifications" className="text-gray-600 hover:text-gray-800">
                            <Bell className="h-6 w-6" />
                        </Link>
                        <Link href="/messages" className="text-gray-600 hover:text-gray-800">
                            <MessageSquare className="h-6 w-6" />
                        </Link>
                        <Link href="/profile" className="text-gray-600 hover:text-gray-800">
                            <User className="h-6 w-6" />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

