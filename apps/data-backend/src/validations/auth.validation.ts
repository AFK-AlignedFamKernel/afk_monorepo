import { z } from "zod";

export const authSchema = {
  login: z.object({
    userAddress: z.string().min(1, "User address is required"),
    loginType: z.enum(["starknet", "ethereum", "other"]),
    signature: z.array(z.string()).min(2),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

export type LoginInput = z.infer<typeof authSchema.login>;
export type RefreshTokenInput = z.infer<typeof authSchema.refreshToken>;
