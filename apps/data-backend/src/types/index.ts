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
