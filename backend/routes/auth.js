import express from "express";
import {
  getAuthorizationUrl,
  authCallbackMiddleware,
  authRefreshMiddleware,
  getUserProfile,
} from "../services/aps.js";

let router = express.Router();

router.get("/api/auth/login", function (req, res) {
  res.redirect(getAuthorizationUrl());
});

router.get("/api/auth/logout", function (req, res) {
  req.session = null;
  res.redirect("http://localhost:3000");
});

router.get("/api/auth/callback", authCallbackMiddleware, function (req, res) {
  res.redirect("http://localhost:3000");
});

router.get("/api/auth/token", authRefreshMiddleware, function (req, res) {
  res.json(req.publicOAuthToken);
});

router.get(
  "/api/auth/profile",
  authRefreshMiddleware,
  async function (req, res, next) {
    try {
      const profile = await getUserProfile(req.internalOAuthToken.access_token);
      res.json({ name: `${profile.name}` });
    } catch (err) {
      console.error("Profile error:", err);
      next(err);
    }
  }
);

export default router;
