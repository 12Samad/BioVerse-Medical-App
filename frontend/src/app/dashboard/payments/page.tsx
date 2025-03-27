"use client"

import { CardFooter } from "@/components/ui/card"

import axios from "axios"
import { Check, CreditCard, Loader2, TriangleAlert, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const plans = [
  {
    title: "Basic",
    price: "$10",
    description: "Perfect for starters",
    features: ["1 user", "10 projects", "5GB storage", "Basic support"],
    planKey: "basic",
    plan_id: "prod_Rt7mk0ht95FrKg",
  },
  {
    title: "Premium",
    price: "$20",
    description: "Great for growing teams",
    features: ["5 users", "25 projects", "100GB storage", "Priority support", "Advanced analytics"],
    planKey: "premium",
    plan_id: "prod_Rt7mhJ8knP2jlk",
  },
  {
    title: "Ultimate",
    price: "$30",
    description: "For large enterprises",
    features: [
      "Unlimited users",
      "50 projects",
      "1TB storage",
      "24/7 support",
      "Custom integrations",
      "Dedicated account manager",
    ],
    planKey: "ultimate",
    plan_id: "prod_Rt7nQ1P1s11HL3",
  },
]

const ManageSubscriptionButton = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [subscriptionStatus, setSubscriptionStatus] = useState("")
  const [generatedVideos, setGeneratedVideos] = useState(0)
  const [planLimit, setPlanLimit] = useState(0)
  // const [userEmail, setUserEmail] = useState("")
  const [currentPlan, setCurrentPlan] = useState("")
  const [currentPlanName, setCurrentPlanName] = useState("")
  const [subscriptionId, setSubscriptionId] = useState("")
  const [loadingPlans, setLoadingPlans] = useState<{ [key: string]: boolean }>({})
  const [isOpen, setIsOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [targetPage, setTargetPage] = useState("")
  const [activeTab, setActiveTab] = useState("stripe")

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const user_id = localStorage.getItem("Medical_User_Id")
        setUserId(user_id || "")

        if (user_id) {
          // Call the check-customer API to get subscription status and plan
          const checkResponse = await axios.post("https://medical-backend-loj4.onrender.com/api/payment/check-customer", {
            user_id: user_id,
          })

          if (checkResponse.data.is_existing_customer) {
            setSubscriptionStatus(checkResponse.data.subscription_status)
            setCurrentPlan(checkResponse.data.current_plan)
            setCurrentPlanName(checkResponse.data.current_plan_name)
            setSubscriptionId(checkResponse.data.subscription_id)
            setGeneratedVideos(Number.parseInt(checkResponse.data.generated_videos) || 0)
            setPlanLimit(Number.parseInt(checkResponse.data.plan_limit) || 0)
          }
        } else {
          console.log("User not logged in!")
          setIsOpen(true)
          setAlertMessage("Must be logged in to select a plan!")
          setTargetPage("login")
        }
      } catch (error) {
        console.error("Error fetching customer data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomerData()
  }, []) // Removed userId from dependencies

  const handleStripeSubscription = async (planKey: string) => {
    setLoadingPlans((prevState) => ({ ...prevState, [planKey]: true }))

    if (!userId) {
      setIsOpen(true)
      setAlertMessage("Must be logged in to select a plan!")
      setTargetPage("login")
      setLoadingPlans((prevState) => ({ ...prevState, [planKey]: false }))
      return
    }

    try {
      // If customer exists and subscription status is active, redirect to customer portal
      if (subscriptionStatus === "active") {
        const portalResponse = await axios.post("https://medical-backend-loj4.onrender.com/api/payment/create-portal-session", {
          user_id: userId,
          subscription_id: subscriptionId,
        })
        window.location.href = portalResponse.data.url
      } else {
        // If subscription is inactive or canceled, redirect to checkout for a new plan
        const checkoutResponse = await axios.post("https://medical-backend-loj4.onrender.com/api/payment/create-checkout-session", {
          user_id: userId,
          // email: userEmail,
          selected_plan: planKey,
          subscription_id: subscriptionId || "",
        })
        window.location.href = checkoutResponse.data.url
      }
    } catch (error) {
      console.error("Error handling subscription:", error)
      setIsOpen(true)
      setAlertMessage("An error occurred while handling the subscription. Please try again later.")
      setTargetPage("")
    } finally {
      setLoadingPlans((prevState) => ({ ...prevState, [planKey]: false }))
    }
  }

  const handlePayPalSubscription = async (planKey: string) => {
    setLoadingPlans((prevState) => ({ ...prevState, [planKey]: true }))

    if (!userId) {
      setIsOpen(true)
      setAlertMessage("Must be logged in to select a plan!")
      setTargetPage("login")
      setLoadingPlans((prevState) => ({ ...prevState, [planKey]: false }))
      return
    }

    try {
      // This is a placeholder for PayPal integration
      // You would implement the actual PayPal checkout flow here
      setIsOpen(true)
      setAlertMessage("PayPal integration coming soon!")
      setTargetPage("")
    } catch (error) {
      console.error("Error handling PayPal subscription:", error)
      setIsOpen(true)
      setAlertMessage("An error occurred while handling the subscription. Please try again later.")
      setTargetPage("")
    } finally {
      setLoadingPlans((prevState) => ({ ...prevState, [planKey]: false }))
    }
  }

  const handleSubscription = (planKey: string) => {
    if (activeTab === "stripe") {
      handleStripeSubscription(planKey)
    } else if (activeTab === "paypal") {
      handlePayPalSubscription(planKey)
    }
  }

  const getUsagePercentage = () => {
    if (!planLimit) return 0
    return Math.min(100, Math.round((generatedVideos / planLimit) * 100))
  }

  return (
    <>
      <div className="min-h-screen container py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Subscription Plans</h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading subscription details...</span>
            </div>
          ) : (
            <>
              {currentPlan && (
                <Card className="mb-8 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl font-bold">
                          Current Plan: <span className="text-primary">{currentPlanName}</span>
                        </CardTitle>
                        <CardDescription className="text-base mt-1">Your active subscription</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-sm py-1">
                        {subscriptionStatus === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">
                            Usage: {generatedVideos} of {planLimit} videos
                          </span>
                          <span className="text-sm font-medium">{getUsagePercentage()}%</span>
                        </div>
                        <Progress value={getUsagePercentage()} className="h-2" />
                      </div>

                      <Button
                        onClick={() => handleSubscription(plans.find((p) => p.plan_id === currentPlan)?.planKey || "")}
                        variant="outline"
                        className="mt-4"
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="stripe" className="mb-8" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="stripe" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit Card (Stripe)</span>
                  </TabsTrigger>
                  <TabsTrigger value="paypal" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>PayPal</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                      <Card
                        key={index}
                        className={`flex flex-col h-full transition-all duration-200 hover:shadow-md ${plan.plan_id === currentPlan ? "border-primary shadow-sm" : ""
                          }`}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl font-bold flex items-center justify-between">
                            {plan.title}
                            {plan.plan_id === currentPlan && (
                              <Badge variant="default" className="ml-2">
                                Current
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow pb-6">
                          <p className="text-3xl font-bold mb-4">
                            {plan.price}
                            <span className="text-sm font-normal">/month</span>
                          </p>
                          <ul className="space-y-3">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button
                            onClick={() => handleSubscription(plan.planKey)}
                            className="w-full"
                            variant={plan.plan_id === currentPlan ? "outline" : "default"}
                            disabled={loadingPlans[plan.planKey]}
                          >
                            {loadingPlans[plan.planKey] ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            {plan.plan_id === currentPlan ? "Current Plan" : `Choose ${plan.title}`}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="paypal" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                      <Card
                        key={index}
                        className={`flex flex-col h-full transition-all duration-200 hover:shadow-md ${plan.plan_id === currentPlan ? "border-primary shadow-sm" : ""
                          }`}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl font-bold flex items-center justify-between">
                            {plan.title}
                            {plan.plan_id === currentPlan && (
                              <Badge variant="default" className="ml-2">
                                Current
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow pb-6">
                          <p className="text-3xl font-bold mb-4">
                            {plan.price}
                            <span className="text-sm font-normal">/month</span>
                          </p>
                          <ul className="space-y-3">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button
                            onClick={() => handleSubscription(plan.planKey)}
                            className="w-full"
                            variant={plan.plan_id === currentPlan ? "outline" : "default"}
                            disabled={loadingPlans[plan.planKey]}
                          >
                            {loadingPlans[plan.planKey] ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            {plan.plan_id === currentPlan ? "Current Plan" : `Choose ${plan.title}`}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <TriangleAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <p>{alertMessage}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => (targetPage ? router.push(`/${targetPage}`) : setIsOpen(false))}>
              {targetPage ? `Go to ${targetPage}` : "Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ManageSubscriptionButton

