"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FcGoogle } from "react-icons/fc"

const SignupPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevData) => ({
      ...prevData,
      [event.target.name]: event.target.value,
    }))
  }

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value)
  }

  const handleSignup = async () => {
    if (formData.password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match. Please try again." })
      return
    }

    setIsLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("https://medical-backend-loj4.onrender.com/api/auth/signup", formData)

      if (response.status === 201) {
        setMessage({
          type: "success",
          text: "Signup Successful! A verification email has been sent to your email address. Please check your inbox and spam folder, and mark it as 'Not Spam' if needed. Follow the instructions to verify your account.",
        })
        // Removed the automatic redirection to login page
      } else {
        setMessage({ type: "error", text: response.data.message || "Signup failed, please try again." })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      console.log("Signup Error:", error.response?.data?.message || "Unknown error")
      setMessage({ type: "error", text: error.response?.data?.message || "Signup failed, please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    router.push("https://medical-backend-loj4.onrender.com/api/auth/google")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Join us and start your journey</p>
        </div>
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {/* <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle> */}
            <AlertDescription className="text-green-500">{message.text}</AlertDescription>
          </Alert>
        )}
        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                name="name"
                required
                className="mt-1"
                placeholder="John Doe"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                required
                className="mt-1"
                placeholder="you@example.com"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                className="mt-1"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                required
                className="mt-1"
                placeholder="••••••••"
                onChange={handleConfirmPasswordChange}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleSignup} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.userPlus className="mr-2 h-4 w-4" />
              )}
              Sign Up
            </Button>

            <Button className="w-full" onClick={handleGoogleSignup} disabled={isLoading} type="button">
              <FcGoogle className="mr-2 h-4 w-4" /> <span>Sign in with Google</span>
            </Button>
          </div>
          <div>
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out mt-2"
            >
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default SignupPage

