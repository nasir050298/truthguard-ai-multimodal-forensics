import dotenv from "dotenv";
import path from "path";
dotenv.config();
export const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "truthguard_super_secret_change_me",
  IMAGE_SERVICE_URL: process.env.IMAGE_SERVICE_URL || "http://localhost:8001",
  VIDEO_SERVICE_URL: process.env.VIDEO_SERVICE_URL || "http://localhost:8002",
  VOICE_SERVICE_URL: process.env.VOICE_SERVICE_URL || "http://localhost:8003",
  MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB || 250),
  DATA_DIR: path.resolve(process.env.DATA_DIR || "./data"),
  UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || "./uploads")
};
