"use client"

import { Card, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TestForm from "./test-form"
import TestRecord from "./test-record"

export default function CreateTestPage() {
    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Questions</h1>
            <Card>
                <CardHeader className="border-b">
                    <Tabs defaultValue="form" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="form">Form</TabsTrigger>
                            <TabsTrigger value="record">Record</TabsTrigger>
                        </TabsList>
                        <TabsContent value="form" className="p-0">
                            <TestForm />
                        </TabsContent>
                        <TabsContent value="record" className="p-0">
                            <TestRecord />
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    )
}

