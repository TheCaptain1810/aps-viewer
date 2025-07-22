import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { logout } = useAuth();

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Use the auth context logout function
        logout();
      } else {
        console.error("Logout failed");
        // Even if server logout fails, logout locally
        logout();
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if the logout request fails, we can still logout locally
      logout();
    }
  };

  // Close menu when clicking outside
  const handleOutsideClick = (e) => {
    if (!e.target.closest(".profile-container")) {
      setShowProfileMenu(false);
    }
  };

  return (
    <div id="header" onClick={handleOutsideClick}>
      <img
        className="logo"
        src="https://cdn.autodesk.io/logo/black/stacked.png"
        alt="Autodesk Platform Services"
      />
      <span className="title">Simple Viewer</span>

      {/* Profile Button */}
      <div className="profile-container">
        <button
          onClick={toggleProfileMenu}
          className="profile-button"
          title="Profile Menu"
        >
          <svg
            style={{ width: "1.25rem", height: "1.25rem", color: "#4b5563" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showProfileMenu && (
          <div className="profile-menu">
            <div
              style={{
                padding: "1rem 1rem 0.5rem",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#111827",
                  margin: "0",
                }}
              >
                APS User
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  margin: "0.25rem 0 0",
                }}
              >
                Connected to Autodesk Platform Services
              </p>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                color: "#374151",
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                transition: "background-color 0.2s",
              }}
            >
              <svg
                style={{
                  width: "1rem",
                  height: "1rem",
                  marginRight: "0.5rem",
                  color: "#6b7280",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
