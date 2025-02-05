import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigSchema } from '../validations/config.validation';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create the config object
const rawConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessTokenExpiry: '30m',
    refreshTokenExpiry: '7d',
  },
  server: {
    port: parseInt(process.env.PORT || '5050', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  },
  rpc: {
    starknetRpcUrl: process.env.STARKNET_RPC_PROVIDER_URL || '',
    starknetNetwork: process.env.STARKNET_RPC_NETWORK || '',
    api_key: process.env.RPC_NODE_API_KEY || '',
    network: process.env.SN_NETWORK || '',
  },
  cloudfare: {
    accountId: process.env.CLOUDFARE_ACCOUNT_ID || '',
    token: process.env.CLOUDFARE_AUTH_TOKEN || '',
    r2BucketName: process.env.CLOUDFARE_R2_BUCKET || '',
    r2Access: process.env.CLOUDFARE_R2_ACCESS || '',
    r2Secret: process.env.CLOUDFARE_R2_SECRET || '',
    r2Domain: process.env.CLOUDFARE_R2_DOMAIN || '',
  },
} as const;

// Parse and validate the configurations
export const configRes = ConfigSchema.safeParse(rawConfig);

if (!configRes.success) {
  console.error('Environment variables are missing or not valid:', configRes.error.issues);
  process.exit(1);
}

export const config = configRes.data;

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
