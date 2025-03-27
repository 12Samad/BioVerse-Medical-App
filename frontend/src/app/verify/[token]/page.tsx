"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useParams } from "next/navigation";
// import axios from "axios";

const VerifyTokenPage = () => {
  const router = useRouter();
  const { token } = useParams();

  useEffect(() => {
    console.log("Verified: ",token);
    if (!token || typeof token !== "string") {
      router.push("/login");
      return;
    }

    localStorage.removeItem("authToken");
    localStorage.setItem("authToken",token);
    router.push("/dashboard");
    
    
    // verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default VerifyTokenPage;
