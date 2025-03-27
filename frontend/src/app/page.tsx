"use client"
import { Button } from "@/components/ui/button"
import { BarChart2, BookOpen, Calendar, Clock, Target } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            BioVerse
          </Link>
          {/* <nav className="hidden md:flex space-x-4">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </nav> */}
          <Button onClick={() => router.push("/signup")}>Sign Up</Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
              Your Personal Medical Study Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Boost your medical studies with our intelligent assistant. Track progress, set goals, and improve your
              performance.
            </p>
            <Button onClick={() => router.push("/signup")} size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </div>
        </section>

        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Calendar className="w-10 h-10 text-primary" />}
                title="Smart Study Calendar"
                description="Updates automatically based on your performance."
              />
              <FeatureCard
                icon={<BarChart2 className="w-10 h-10 text-primary" />}
                title="Performance Tracking"
                description="See your accuracy rate, study hours, and progress."
              />
              <FeatureCard
                icon={<Target className="w-10 h-10 text-primary" />}
                title="Custom Weekly Goals"
                description="Set and track personalized study objectives."
              />
              <FeatureCard
                icon={<BookOpen className="w-10 h-10 text-primary" />}
                title="Digital Error Notebook"
                description="Log and review mistakes to improve."
              />
              <FeatureCard
                icon={<Clock className="w-10 h-10 text-primary" />}
                title="Pomodoro Timer"
                description="Focused study blocks to boost productivity."
              />
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Medical Studies?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of medical students who are already improving their study efficiency and performance.
            </p>
            <Button onClick={() => router.push("/signup")} size="lg" className="text-lg px-8">
              Start Your Free Trial
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm mb-4 md:mb-0">© {new Date().getFullYear()} MedStudyAssist. All rights reserved.</div>
          <nav className="flex space-x-4">
            <Link href="#" className="hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-gray-300">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-gray-300">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

