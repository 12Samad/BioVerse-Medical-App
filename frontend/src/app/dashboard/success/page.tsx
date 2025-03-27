"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle, Home } from "lucide-react"
import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-fit">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-2 pb-6">
          <p className="text-muted-foreground">Thank you for your purchase. Your subscription has been activated.</p>
          <div className="rounded-lg bg-muted p-4 mt-4">
            <p className="text-sm font-medium">What&apos;s next?</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Access your premium features</li>
              <li>• Set up your study schedule</li>
              <li>• Start exploring new content</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              <ArrowRight className="mr-2 h-4 w-4" />
              Start Learning
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

