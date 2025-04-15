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
      port: parseInt(process.env.PORT || '3003', 10),
      host: process.env.HOST || '0.0.0.0',
    },
    rpc: {
      starknetRpcUrl: process.env.STARKNET_RPC_PROVIDER_URL || '',
      starknetNetwork: process.env.STARKNET_RPC_NETWORK || '',
      api_key: process.env.RPC_NODE_API_KEY || '',
      network: process.env.SN_NETWORK || '',
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

