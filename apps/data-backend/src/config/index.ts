import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { ConfigSchema } from "../validations/config.validation";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Create the config object
const rawConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    accessTokenExpiry: "30m",
    refreshTokenExpiry: "7d",
  },
  server: {
    port: parseInt(process.env.PORT || "5050", 10),
    host: process.env.HOST || "0.0.0.0",
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  },
} as const;

// Parse and validate the configuration
export const config = ConfigSchema.parse(rawConfig);

// Type inference
export type Config = z.infer<typeof ConfigSchema>;

// Configure Cloudinary with validated config
const { cloud_name, api_key, api_secret } = config.cloudinary;

// No need for manual check since Zod will throw if values are empty
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export default cloudinary;
