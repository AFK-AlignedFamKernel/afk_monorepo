import { Signature, TypedData } from 'starknet';

export interface UserJwtPayload {
  id: string;
  userAddress: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface SignatureVerificationRequest {
  accountAddress: string;
  signature: {
    r: string;
    s: string;
  };
  typedData?: any;
  message?: string;
}

/**
 * Twitter Types
 */
export enum SocialPlatform {
  TWITTER = 'TWITTER',
  // Add other platforms as needed
  // GITHUB = "GITHUB",
  // GOOGLE = "GOOGLE",
}

export interface TwitterUserDetails {
  id: string;
  username: string;
  name: string;
  picture?: string;
}

export interface ConnectTwitterParams {
  userId: string;
  code: string;
  codeVerifier: string;
}

// Extend FastifyRequest to include session
declare module 'fastify' {
  interface FastifyRequest {
    user: UserJwtPayload | null | undefined;
    session: any | undefined; // Using any for now since we don't need the full session type
  }
}
