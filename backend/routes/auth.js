import express from "express";
import { getViewerToken } from "../services/aps.js";

let router = express.Router();

router.get("/api/auth/token", async (req, res, next) => {
  try {
    res.json(await getViewerToken());
  } catch (error) {
    next(error);
  }
});

router.get("/api/auth/status", async (req, res, next) => {
  try {
    // Check if we can get a valid token
    const token = await getViewerToken();
    if (token && token.access_token) {
      res.json({
        authenticated: true,
        message: "Connected to Autodesk Platform Services",
        tokenType: token.token_type,
        expiresIn: token.expires_in,
      });
    } else {
      res.status(401).json({
        authenticated: false,
        message: "Unable to authenticate with APS",
      });
    }
  } catch (error) {
    res.status(401).json({
      authenticated: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
});

router.post("/api/auth/logout", async (req, res, next) => {
  try {
    // Clear any session data if we were using sessions
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
    }

    // Clear cookies if any
    res.clearCookie("connect.sid"); // Default session cookie name
    res.clearCookie("aps-session"); // Custom cookie if we had one

    // Send success response
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    next(error);
  }
});

export default router;
