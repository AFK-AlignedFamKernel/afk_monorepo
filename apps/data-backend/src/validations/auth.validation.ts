import { z } from "zod";

export const authSchema = {
  login: z.object({
    userAddress: z.string().min(1, "User address is required"),
    loginType: z.enum(["starknet", "ethereum", "other"]),
    signature: z.array(z.string()).min(2),
    signedData: z.string().min(1, "Signed data is required"),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),

  twitterCallback: z.object({
    codeVerifier: z.string().min(1, "Refresh token is required"),
    code: z.string().min(1, "Refresh token is required"),
  }),

  connectTwitterParams: z.object({
    userId: z.string().min(1, "UserId is required"),
    codeVerifier: z.string().min(1, "Code Verifier is required"),
    code: z.string().min(1, "Code is required"),
  }),
};

export type ConnectTwitterInput = z.infer<
  typeof authSchema.connectTwitterParams
>;
export type TwitterCallbackInput = z.infer<typeof authSchema.twitterCallback>;
export type LoginInput = z.infer<typeof authSchema.login>;
export type RefreshTokenInput = z.infer<typeof authSchema.refreshToken>;
