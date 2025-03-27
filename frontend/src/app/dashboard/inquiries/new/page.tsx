"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createInquiry } from "@/lib/inquiries-api"

const formSchema = z.object({
    title: z.string().min(5, {
        message: "Title must be at least 5 characters.",
    }),
    category: z.string({
        required_error: "Please select a category.",
    }),
    description: z.string().min(20, {
        message: "Description must be at least 20 characters.",
    }),
    attachments: z.any().optional(),
})

export default function NewInquiryPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            await createInquiry(values)
            toast.success("Inquiry submitted successfully")
            router.push("/dashboard/inquiries")
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to submit inquiry")
            } else {
                toast.error("Failed to submit inquiry")
            }
            console.error("Error submitting inquiry:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container mx-auto max-w-full py-10">
            <div className="mb-8">
                <Link href="/dashboard/inquiries" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to inquiries
                </Link>
            </div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Submit a New Inquiry</h1>
                <p className="text-muted-foreground mt-2">
                    Fill out the form below to submit your inquiry. We&apos;ll get back to you as soon as possible.
                </p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Brief title of your inquiry" {...field} />
                                </FormControl>
                                <FormDescription>A concise title that summarizes your inquiry.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="academic">Academic</SelectItem>
                                        <SelectItem value="financial">Financial</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="administrative">Administrative</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>Select the category that best matches your inquiry.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Provide detailed information about your inquiry"
                                        className="min-h-[200px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Please provide as much detail as possible to help us address your inquiry effectively.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="attachments"
                        render={({ field: { onChange, ...field } }) => (
                            <FormItem>
                                <FormLabel>Attachments (Optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        multiple
                                        onChange={(e) => onChange(e.target.files)}
                                        className="cursor-pointer"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Upload any relevant files (max 5MB per file).</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Inquiry
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

