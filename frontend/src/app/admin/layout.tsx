"use client";
import axios from "axios";
import { useEffect, useState } from "react";
// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

import { AdminNavbar } from "@/components/adminNavbar";
import { AdminSidebar } from "@/components/adminSidebar";
import type React from "react"; // Import React

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Simple Dashboard",
//   description: "A simple dashboard with sidebar and navbar",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // ✅ Check protected route on mount
  useEffect(() => {
    const checkProtectedRoute = async () => {
      const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

      if (!token) {
        alert("You must log in first.");
        window.location.href = "/login"; // Redirect to login page
        return;
      }

      try {
        const response = await axios.get("https://medical-backend-loj4.onrender.com/api/auth/protected", {
          headers: { Authorization: `Bearer ${token}` }, // Send token in Authorization header
        });

        console.log(`Access granted: ${response.data.message}`);
        console.log("User logged in with id:  ", response.data.userId)
        localStorage.setItem("Admin_Id", response.data.userId);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          // alert("Access denied. Please log in again.");
          console.error("Protected route error:", err.response?.data?.message || err.message);
        } else {
          console.error("Unexpected error:", err);
        }
        console.log("It's an error");
        window.location.href = "/login"; // Redirect to login page if verification fails
      }
    };

    checkProtectedRoute(); // Call function on mount
  }, []);

  const [isOpen, setIsShowSidebar] = useState(true)

  const toggleSidebar = () => {
    setIsShowSidebar(prev => !prev)
  }

  return (
    <html lang="en" className="overflow-y-hidden">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          <AdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AdminNavbar toggleSidebar={toggleSidebar} />
            <main className="flex-1 overflow-x-hidden overflow-y-jh bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
