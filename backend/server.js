import express from "express";
import session from "cookie-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import hubsRouter from "./routes/hubs.js";
import bucketsRouter from "./routes/buckets.js";
import modelsRouter from "./routes/models.js";

import { PORT, SERVER_SESSION_SECRET } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173", // Vite dev server
      "https://aps-viewer-frontend.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(
  session({ secret: SERVER_SESSION_SECRET, maxAge: 24 * 60 * 60 * 1000 })
);

// Serve static files from frontend dist directory
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use(authRouter);
app.use(hubsRouter);
app.use(bucketsRouter);
app.use(modelsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Serve the frontend for any non-API routes
// app.get(/(.*)/, (req, res) => {
//   if (!req.path.startsWith("/api")) {
//     res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
