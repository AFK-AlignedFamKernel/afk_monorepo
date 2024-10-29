import { z } from "zod";

export const authSchema = {
  login: z.object({
    userAddress: z.string().min(1, "User address is required"),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

export type LoginInput = z.infer<typeof authSchema.login>;
export type RefreshTokenInput = z.infer<typeof authSchema.refreshToken>;
