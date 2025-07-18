import { useState, useEffect } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resp = await fetch(`${SERVER_URL}/api/auth/profile`, {
        credentials: "include",
      });

      if (resp.ok) {
        const userData = await resp.json();
        setUser(userData);
        return userData;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setError("Authentication check failed");
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.replace(`${SERVER_URL}/api/auth/login`);
  };

  const logout = () => {
    const iframe = document.createElement("iframe");
    iframe.style.visibility = "hidden";
    iframe.src = "https://accounts.autodesk.com/Authentication/LogOut";
    document.body.appendChild(iframe);
    iframe.onload = () => {
      window.location.replace(`${SERVER_URL}/api/auth/logout`);
      document.body.removeChild(iframe);
    };
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    checkAuthStatus,
  };
}
