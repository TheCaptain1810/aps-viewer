import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

export const APS_CLIENT_ID = process.env.APS_CLIENT_ID;
export const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET;
export const APS_BUCKET = process.env.APS_BUCKET || "aps-simple-viewer-bucket";
export const PORT = process.env.PORT || 8080;
