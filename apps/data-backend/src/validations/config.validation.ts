import { z } from "zod";
// Define the schema for the configuration
export const ConfigSchema = z.object({
  jwt: z.object({
    secret: z.string().min(1, "JWT secret is required"),
    accessTokenExpiry: z.string(),
    refreshTokenExpiry: z.string(),
  }),
  server: z.object({
    port: z.number().int().positive(),
    host: z.string(),
  }),
  cloudinary: z.object({
    cloud_name: z.string().min(1, "Cloudinary cloud name is required"),
    api_key: z.string().min(1, "Cloudinary API key is required"),
    api_secret: z.string().min(1, "Cloudinary API secret is required"),
  }),
  cloudfare: z.object({
    accountId: z.string().min(1, "Cloudfare accountId is required"),
    token: z.string().min(1, "Cloudfare Auth Token is required"),
    r2BucketName: z.string().min(1, "Cloudfare r2 bucket name is required"),
    r2Access: z.string().min(1, "Cloudfare r2 accountId is required"),
    r2Secret: z.string().min(1, "Cloudfare r2 secret is required"),
    r2Domain: z.string().min(1, "Cloudfare r2 Domain is required"),
  }),
  rpc: z.object({
    starknetRpcUrl: z.string().min(1, "RPC url required"),
    starknetNetwork: z.string().min(1, "StarknetNetwork required"),
    api_key: z.string().min(1, "Rpc apikey required"),
    network: z.string().min(1, "Rpc network required"),
  }),
});
