"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Mail, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState("")

    // FAQ categories and questions
    const faqCategories = [
        {
            id: "general",
            name: "General",
            questions: [
                {
                    id: "what-is",
                    question: "What is Bioverse?",
                    answer:
                        "Bioverse is a platform that connects medical professionals seeking mentorship with experienced mentors in various medical specialties. Our platform facilitates knowledge sharing, career guidance, and professional development through one-on-one mentorship sessions.",
                },
                {
                    id: "how-works",
                    question: "How does the mentorship program work?",
                    answer:
                        "Our mentorship program works in three simple steps: First, browse our catalog of verified medical mentors and find someone whose expertise matches your needs. Second, book a session at a time that works for both of you. Third, connect with your mentor via our secure video platform for your scheduled session. After the session, you can leave feedback and book follow-up sessions if desired.",
                },
                {
                    id: "who-mentors",
                    question: "Who are the mentors?",
                    answer:
                        "Our mentors are experienced medical professionals from various specialties including physicians, surgeons, researchers, healthcare administrators, and other healthcare experts. All mentors are vetted for their qualifications, experience, and commitment to mentoring. Many have 10+ years of experience in their fields and hold leadership positions at respected medical institutions.",
                },
                {
                    id: "benefits",
                    question: "What are the benefits of finding a mentor?",
                    answer:
                        "Finding a mentor can provide numerous benefits including personalized guidance tailored to your career goals, access to industry insights and best practices, networking opportunities, skill development, confidence building, and accelerated career progression. Medical mentors can help with everything from clinical skills to research guidance, career decisions, and work-life balance strategies.",
                },
            ],
        },
        {
            id: "sessions",
            name: "Mentorship Sessions",
            questions: [
                {
                    id: "session-length",
                    question: "How long are mentorship sessions?",
                    answer:
                        "Mentorship sessions typically last between 30 to 60 minutes, depending on the mentor's offering. The exact duration is clearly indicated on each mentor's profile and mentorship package.",
                },
                {
                    id: "session-format",
                    question: "What happens during a mentorship session?",
                    answer:
                        "During a mentorship session, you'll connect with your mentor via our secure video platform. The content of the session depends on your goals and the mentor's expertise. Sessions may include discussions about career advice, clinical case reviews, research guidance, skill development, or any other professional topics you've agreed to discuss. We encourage you to come prepared with specific questions or topics to make the most of your time.",
                },
                {
                    id: "prepare",
                    question: "How should I prepare for my first session?",
                    answer:
                        "To make the most of your mentorship session, we recommend: 1) Clearly defining your goals and what you hope to achieve, 2) Preparing specific questions or topics you'd like to discuss, 3) Gathering any relevant materials or information that might be helpful, 4) Testing your audio/video setup before the session, and 5) Being ready to take notes during your conversation.",
                },
                {
                    id: "reschedule",
                    question: "Can I reschedule or cancel my session?",
                    answer:
                        "Yes, you can reschedule or cancel your session through your dashboard. Please note that cancellations must be made at least 24 hours before the scheduled session to be eligible for a refund or rescheduling. Last-minute cancellations or no-shows may result in forfeiture of the session fee.",
                },
            ],
        },
        {
            id: "booking",
            name: "Booking & Payments",
            questions: [
                {
                    id: "how-book",
                    question: "How do I book a session with a mentor?",
                    answer:
                        "To book a session, first browse our mentor directory and select a mentor who matches your needs. On their profile, you'll see their available mentorship offerings. Select your preferred mentorship package, choose an available date and time slot from their calendar, and proceed to checkout. After completing payment, you'll receive a confirmation email with session details.",
                },
                {
                    id: "payment-methods",
                    question: "What payment methods do you accept?",
                    answer:
                        "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) for payment. All transactions are processed securely through Stripe, our payment processor.",
                },
                {
                    id: "pricing",
                    question: "How is pricing determined?",
                    answer:
                        "Pricing varies based on the mentor's experience, expertise, and the type of mentorship offering. Each mentor sets their own rates, which are clearly displayed on their profile and mentorship packages. Prices typically range from $50 to $300 per session, depending on the mentor's seniority and the session duration.",
                },
                {
                    id: "refunds",
                    question: "What is your refund policy?",
                    answer:
                        "If you cancel more than 24 hours before your scheduled session, you'll receive a full refund. Cancellations within 24 hours of the session are not eligible for refunds. If a mentor cancels a session, you'll automatically receive a full refund or have the option to reschedule. If you're unsatisfied with your session, please contact our support team within 48 hours, and we'll work to resolve the issue.",
                },
            ],
        },
        {
            id: "technical",
            name: "Technical Questions",
            questions: [
                {
                    id: "tech-requirements",
                    question: "What are the technical requirements for mentorship sessions?",
                    answer:
                        "For the best experience, we recommend: 1) A stable internet connection (minimum 1 Mbps, 5+ Mbps recommended), 2) An updated browser (Chrome, Firefox, Safari, or Edge), 3) A working webcam and microphone, 4) Headphones for better audio quality, and 5) A quiet, well-lit environment for your session.",
                },
                {
                    id: "connection-issues",
                    question: "What if I experience technical difficulties during my session?",
                    answer:
                        "If you experience technical issues during your session, first try refreshing your browser. If problems persist, you can use the in-session chat to communicate with your mentor. Our platform automatically logs connection issues, and if significant time is lost due to technical problems on our end, we'll offer to extend the session or provide partial credit for a future session.",
                },
                {
                    id: "browser-compatibility",
                    question: "Which browsers are supported?",
                    answer:
                        "Our platform works best with the latest versions of Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience. Internet Explorer is not supported.",
                },
                {
                    id: "mobile-support",
                    question: "Can I use the platform on mobile devices?",
                    answer:
                        "Yes, our platform is fully responsive and works on smartphones and tablets. For the best experience, we recommend using our mobile app (available for iOS and Android) or accessing the platform through a mobile browser in landscape mode.",
                },
            ],
        },
        {
            id: "privacy",
            name: "Privacy & Security",
            questions: [
                {
                    id: "data-protection",
                    question: "How is my personal information protected?",
                    answer:
                        "We take data protection seriously. All personal information is encrypted and stored securely in compliance with HIPAA and GDPR regulations. We never share your personal information with third parties without your explicit consent. For more details, please review our Privacy Policy.",
                },
                {
                    id: "session-confidentiality",
                    question: "Are my mentorship sessions confidential?",
                    answer:
                        "Yes, all mentorship sessions are strictly confidential. Sessions are not recorded by default (though you and your mentor may agree to record for educational purposes). Our mentors adhere to professional codes of conduct and confidentiality agreements. Any clinical discussions must follow anonymization protocols to protect patient privacy.",
                },
                {
                    id: "hipaa",
                    question: "Is the platform HIPAA compliant?",
                    answer:
                        "Yes, our platform is designed to be HIPAA compliant for discussions related to medical cases. However, we remind all users that specific patient identifiers should never be shared during sessions. When discussing clinical cases, all information should be properly anonymized in accordance with HIPAA guidelines.",
                },
            ],
        },
    ]

    // Filter questions based on search query
    const filteredFAQs = searchQuery
        ? faqCategories
            .map((category) => ({
                ...category,
                questions: category.questions.filter(
                    (q) =>
                        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
                ),
            }))
            .filter((category) => category.questions.length > 0)
        : faqCategories

    return (
        <div className="min-h-screen ">

            <main className="container py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
                        <p className="text-xl text-muted-foreground">
                            Find answers to common questions about our medical mentorship platform
                        </p>
                    </div>

                    <div className="relative mb-10">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search for questions..."
                            className="pl-10 py-6 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Tabs defaultValue="general" className="mb-12">
                        <TabsList className="mb-8 w-full justify-start overflow-x-auto">
                            {faqCategories.map((category) => (
                                <TabsTrigger key={category.id} value={category.id}>
                                    {category.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {searchQuery && filteredFAQs.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-medium mb-2">No results found</h3>
                                <p className="text-muted-foreground mb-6">
                                    We couldn&apos;t find any FAQs matching your search. Try different keywords or browse by category.
                                </p>
                                <Button variant="outline" onClick={() => setSearchQuery("")}>
                                    Clear Search
                                </Button>
                            </div>
                        ) : searchQuery ? (
                            // Show all filtered results when searching
                            <div className="space-y-8">
                                <h2 className="text-xl font-semibold">Search Results</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {filteredFAQs.map((category) => (
                                        <div key={category.id} className="mb-8">
                                            <h3 className="text-lg font-medium mb-4">{category.name}</h3>
                                            {category.questions.map((faq) => (
                                                <AccordionItem key={faq.id} value={faq.id}>
                                                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="pt-2 pb-4 text-muted-foreground">{faq.answer}</div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </div>
                                    ))}
                                </Accordion>
                            </div>
                        ) : (
                            // Show tabbed content when not searching
                            faqCategories.map((category) => (
                                <TabsContent key={category.id} value={category.id}>
                                    <Accordion type="single" collapsible className="w-full">
                                        {category.questions.map((faq) => (
                                            <AccordionItem key={faq.id} value={faq.id}>
                                                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="pt-2 pb-4 text-muted-foreground">{faq.answer}</div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </TabsContent>
                            ))
                        )}
                    </Tabs>

                    <div className="bg-muted rounded-lg p-8 text-center">
                        <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                            If you couldn&apos;t find the answer to your question, our support team is here to help. Feel free to reach out
                            to us.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a 
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=info@aidevgen.agency&su=Support%20Request%20-%20Bioverse" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-block"
                            >
                                <Button className="gap-2">
                                    <Mail className="h-4 w-4" />
                                    Contact Support
                                </Button>
                            </a>
                            <Link href="/dashboard/mentor">
                                <Button variant="outline" className="gap-2">
                                    Browse Mentors
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-sm text-muted-foreground">© 2025 Bioverse. All rights reserved.</p>
                    <nav className="flex items-center gap-4 text-sm">
                        <Link href="/terms" className="text-muted-foreground underline-offset-4 hover:underline">
                            Terms
                        </Link>
                        <Link href="/privacy" className="text-muted-foreground underline-offset-4 hover:underline">
                            Privacy
                        </Link>
                        <Link href="/faq" className="text-muted-foreground underline-offset-4 hover:underline">
                            FAQ
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    )
}