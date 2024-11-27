import { Signature, TypedData } from "starknet";
export interface UserJwtPayload {
  id: string;
  userAddress: string;
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
  TWITTER = "TWITTER",
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
