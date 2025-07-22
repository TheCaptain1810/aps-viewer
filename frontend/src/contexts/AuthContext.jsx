import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user was previously authenticated
      const wasAuthenticated = localStorage.getItem("aps_authenticated");
      const authTime = localStorage.getItem("aps_auth_time");

      if (wasAuthenticated && authTime) {
        // Check if authentication is still valid (within 1 hour)
        const authDate = new Date(authTime);
        const now = new Date();
        const hoursSinceAuth = (now - authDate) / (1000 * 60 * 60);

        if (hoursSinceAuth < 1) {
          // Verify authentication using the status endpoint
          const response = await fetch("/api/auth/status");
          if (response.ok) {
            const statusData = await response.json();
            if (statusData.authenticated) {
              setIsAuthenticated(true);
              return;
            }
          }
        }
      }

      // Clear invalid authentication data
      localStorage.removeItem("aps_authenticated");
      localStorage.removeItem("aps_auth_time");
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("aps_authenticated");
    localStorage.removeItem("aps_auth_time");
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
