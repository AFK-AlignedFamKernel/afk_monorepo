import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { config } from "../../config";

export class AuthService {
  constructor(private prisma: PrismaClient, private fastify: FastifyInstance) {}

  async loginOrCreateUser(userAddress: string, loginType: string) {
    let user = await this.prisma.user.findUnique({
      where: { userAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          userAddress,
          verified: false,
          loginType,
        },
      });
    }

    const tokenPayload = {
      id: user.id,
      userAddress: user.userAddress,
    };

    const accessToken = this.fastify.jwt.sign(tokenPayload, {
      expiresIn: config.jwt.accessTokenExpiry,
    });

    const refreshToken = this.fastify.jwt.sign(tokenPayload, {
      expiresIn: config.jwt.refreshTokenExpiry,
    });

    return {
      user: {
        id: user.id,
        userAddress: user.userAddress,
        email: user.email,
        verified: user.verified,
      },
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const decoded = this.fastify.jwt.verify(refreshToken);

    // Verify user still exists
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: decoded.id },
    });

    const tokenPayload = {
      id: user.id,
      userAddress: user.userAddress,
    };

    // Generate new tokens
    const newAccessToken = this.fastify.jwt.sign(tokenPayload, {
      expiresIn: config.jwt.accessTokenExpiry,
    });

    const newRefreshToken = this.fastify.jwt.sign(tokenPayload, {
      expiresIn: config.jwt.refreshTokenExpiry,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: "Bearer",
    };
  }

  async getUserProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        socialAccounts: true,
      },
    });
  }
}
