"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setAuthToken } from "@/utils/auth"
import axios from "axios"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { FcGoogle } from "react-icons/fc"

const LoginPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: "", password: "", role: "user" })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prevData) => ({
      ...prevData,
      [event.target.name]: event.target.value,
    }))
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setMessage(null)
    localStorage.removeItem("authToken")
    try {
      const response = await axios.post("https://medical-backend-loj4.onrender.com/api/auth/login", formData)

      if (response.status === 200) {
        setAuthToken(response.data.token)
        localStorage.setItem("authToken", response.data.token)
        localStorage.setItem("name", response.data?.name)
        localStorage.setItem("email", response.data?.email)

        if (response.data.role === "admin") {
          router.push("/admin")
          return
        }

        if (response.data.isNewUser) {
          setMessage({ type: "success", text: "New user! Redirecting to signup..." })
          setTimeout(() => router.push("/signup"), 2000)
        } else {
          setMessage({ type: "success", text: "Login successful! Redirecting..." })
          setTimeout(() => router.push("/dashboard"), 2000)
        }
      } else {
        setMessage({ type: "error", text: response.data.message || "Login failed, please try again." })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setMessage({ type: "error", text: error.response?.data?.message || "Login failed, please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Log in to access your account</p>
        </div>
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
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
            <div className="flex items-center justify-between">
              {/* <div className="flex items-center space-x-2">
                <select
                  id="role"
                  name="role"
                  className="text-sm text-gray-500 bg-transparent border-none focus:ring-0"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div> */}
              <div className="text-sm">
                <p onClick={() => router.push("/forgot")} className="cursor-pointer text-blue-400">
                  Forgot Password?
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? <span className="mr-2">Loading...</span> : <span className="mr-2">Log in</span>}
          </Button>

          <Button className="w-full" onClick={handleGoogleLogin} disabled={isLoading} type="button">
            <FcGoogle className="mr-2" /> <span>Continue with Google</span>
          </Button>
        </form>
        <div className="text-sm text-center">
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage

