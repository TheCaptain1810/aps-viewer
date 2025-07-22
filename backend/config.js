import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env") });

const config = {
  APS_CLIENT_ID: process.env.APS_CLIENT_ID,
  APS_CLIENT_SECRET: process.env.APS_CLIENT_SECRET,
  PORT: process.env.PORT || 8080,
};

export default config;
