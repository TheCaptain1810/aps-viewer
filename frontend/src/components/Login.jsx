import { useState } from "react";

const Login = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      // For APS, we're using 2-legged OAuth (client credentials)
      // which doesn't require user login, but we can simulate checking
      // if the client credentials are properly configured
      const response = await fetch("/api/auth/token");

      if (response.ok) {
        const tokenData = await response.json();
        if (tokenData.access_token) {
          // Store authentication state
          localStorage.setItem("aps_authenticated", "true");
          localStorage.setItem("aps_auth_time", new Date().toISOString());
          onLogin();
        } else {
          throw new Error("Invalid token response");
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Authentication failed" }));
        throw new Error(errorData.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.message ||
          "Failed to authenticate with Autodesk Platform Services"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <img
            src="https://cdn.autodesk.io/logo/black/stacked.png"
            alt="Autodesk Platform Services"
            className="login-logo"
          />
          <h1 className="login-title">APS Viewer</h1>
          <p className="login-subtitle">
            Connect to Autodesk Platform Services to view and manage your 3D
            models
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="login-error">
            <svg
              className="login-error-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Content */}
        <div className="login-content">
          <div className="login-info">
            <div className="login-feature">
              <svg
                className="login-feature-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <div>
                <h3>Manage Buckets</h3>
                <p>Create, view, and delete storage buckets for your models</p>
              </div>
            </div>

            <div className="login-feature">
              <svg
                className="login-feature-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <div>
                <h3>Upload Models</h3>
                <p>Upload and process 3D models for web viewing</p>
              </div>
            </div>

            <div className="login-feature">
              <svg
                className="login-feature-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <div>
                <h3>3D Viewer</h3>
                <p>Interactive 3D viewing with pan, zoom, and rotation</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className={`login-button ${isLoading ? "loading" : ""}`}
          >
            {isLoading ? (
              <>
                <div className="login-spinner"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg
                  className="login-button-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Connect to APS</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>
            This application uses the Autodesk Platform Services SDK to provide
            3D model viewing capabilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
