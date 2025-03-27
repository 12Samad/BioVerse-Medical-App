export const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token); // ✅ Store token securely
    }
  };
  
  export const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token"); // ✅ Retrieve token
    }
    return null;
  };
  
  export const removeAuthToken = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token"); // ✅ Remove token on logout
    }
  };
  