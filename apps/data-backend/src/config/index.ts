import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigSchema } from '../validations/config.validation';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create the config object
function getConfig() {
  const rawConfig = {
    jwt: {
      secret: process.env.JWT_SECRET || '',
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
    pinata: {
      jwt: process.env.PINATA_JWT || '',
      ipfsGateway: process.env.IPFS_GATEWAY || '',
      uploadGatewayUrl: process.env.PINATA_UPLOAD_GATEWAY_URL || '',
      pinataSignUrl: process.env.PINATA_PINATA_SIGN_URL || '',
      uploadUrl: process.env.PINATA_UPLOAD_URL || '',
      apiKey: process.env.PINATA_API_KEY || '',
      apiSecret: process.env.PINATA_API_SECRET || '',
      apiUrl: process.env.PINATA_API_URL || '',
      apiVersion: process.env.PINATA_API_VERSION || '',
      apiTimeout: process.env.PINATA_API_TIMEOUT || '',
    },
  } as const;

  if (process.env.NODE_ENV === 'development') {
    return {
      ...rawConfig,
      jwt: {
        ...rawConfig.jwt,
        secret: rawConfig.jwt.secret || 'a secret with minimum length of 32 characters',
      },
      cloudinary: {
        cloud_name: rawConfig.cloudinary.cloud_name || 'default_name',
        api_key: rawConfig.cloudinary.api_key || 'KEY_xxxxxx',
        api_secret: rawConfig.cloudinary.api_secret || 'SECRET_xxxxxx',
      },
      cloudfare: {
        accountId: rawConfig.cloudfare.accountId || 'ID_xxxxxx',
        token: rawConfig.cloudfare.token || 'TOKEN_xxxxxx',
        r2BucketName: rawConfig.cloudfare.r2BucketName || 'default_name',
        r2Access: rawConfig.cloudfare.r2Access || 'ACCESS_xxxxxx',
        r2Secret: rawConfig.cloudfare.r2Secret || 'SECRET_xxxxxx',
        r2Domain: rawConfig.cloudfare.r2Domain || 'DOMAIN_xxxxxx',
      },
      pinata: {
        jwt: rawConfig.pinata.jwt || 'JWT_xxxxxx',
        ipfsGateway: rawConfig.pinata.ipfsGateway || 'URL_xxxxxx',
        uploadGatewayUrl: rawConfig.pinata.uploadGatewayUrl || 'URL_xxxxxx',
        pinataSignUrl: rawConfig.pinata.pinataSignUrl || 'URL_xxxxxx',
        uploadUrl: rawConfig.pinata.uploadUrl || 'URL_xxxxxx',
        apiKey: rawConfig.pinata.apiKey || 'KEY_xxxxxx',
        apiSecret: rawConfig.pinata.apiSecret || 'SECRET_xxxxxx',
        apiUrl: rawConfig.pinata.apiUrl || 'URL_xxxxxx',
        apiVersion: rawConfig.pinata.apiVersion || 'VERSION_xxxxxx',
        apiTimeout: rawConfig.pinata.apiTimeout || 'TIMEOUT_xxxxxx',
      },
    };
  }
  return rawConfig;
}

// Parse and validate the configurations
export const configRes = ConfigSchema.safeParse(getConfig());

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
