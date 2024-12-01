import * as envVar from 'env-var';
import { config } from 'dotenv';

config();

export const env = {
  app: {
    port: envVar.get('APP_PORT').default(3000).asPortNumber(),
    env: envVar.get('APP_ENV').default('development').asString(),
    isProduction:
      envVar.get('APP_ENV').default('development').asString() === 'production',
    isDevelopment:
      envVar.get('APP_ENV').default('development').asString() === 'development',
    isStaging:
      envVar.get('APP_ENV').default('development').asString() === 'staging',
  },
  indexer: {
    network: envVar.get('NETWORK').default('sepolia').asString(),
    dnaToken: envVar.get('DNA_TOKEN').required().asString(),
    dnaClientUrl: envVar
      .get('DNA_CLIENT_URL')
      .default('dns:///sepolia.starknet.a5a.ch')
      .asString(),
  },
};
