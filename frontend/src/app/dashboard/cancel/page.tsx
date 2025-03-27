"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card className="border-orange-200">
        <CardHeader className="bg-orange-50 border-b border-orange-100">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-orange-100 p-3">
              <XCircle className="h-12 w-12 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-orange-800">Payment Cancelled</CardTitle>
          <CardDescription className="text-center text-orange-700">Your payment was not completed</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You ve cancelled the payment process. If you experienced any issues or have questions about our
              subscription plans, please contact our support team.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Need help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team is available 24/7 to assist you with any questions or concerns about our subscription
                plans or payment process.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/payment">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/support">Contact Support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

