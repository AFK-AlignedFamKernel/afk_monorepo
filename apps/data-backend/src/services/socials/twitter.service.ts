import { type IParsedOAuth2TokenResult, TwitterApi } from "twitter-api-v2";
import { addDays } from "date-fns";
import {
  ConnectTwitterParams,
  SocialPlatform,
  TwitterUserDetails,
} from "../../types";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

export class TwitterService {
  private client: TwitterApi;
  private static readonly TOKEN_EXPIRY_DAYS = 1;

  constructor(private prisma: PrismaClient, private fastify: FastifyInstance) {
    this.client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    });
  }

  async getAuthorizationLink() {
    const data = this.client.generateOAuth2AuthLink(
      process.env.TWITTER_CALLBACK_URL!,
      {
        scope: ["tweet.read", "users.read", "offline.access"],
      }
    );

    return data;
  }

  async handleCallback({
    code,
    codeVerifier,
  }: {
    code: string;
    codeVerifier: string;
  }): Promise<IParsedOAuth2TokenResult> {
    const resp = await this.client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK_URL!,
    });

    return resp;
  }

  async getUserDetails(accessToken: string): Promise<TwitterUserDetails> {
    const userClient = new TwitterApi(accessToken);
    const me = await userClient.v2.me();

    if (!me.data) {
      throw new Error("Failed to fetch Twitter user details");
    }

    return {
      id: me.data.id,
      username: me.data.username,
      name: me.data.name,
      picture: me.data.profile_image_url,
    };
  }

  async connectAccount({ userId, code, codeVerifier }: ConnectTwitterParams) {
    try {
      // 1. Verify the user exists in the `User` table
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} does not exist.`);
      }

      // 2. Complete OAuth flow
      const { accessToken, refreshToken, expiresIn } =
        await this.handleCallback({ code, codeVerifier });

      // 3. Get user details from Twitter
      const twitterUser = await this.getUserDetails(accessToken);

      // 4. Calculate token expiration
      const expiresAt = addDays(new Date(), TwitterService.TOKEN_EXPIRY_DAYS);

      // 5. Upsert the social account
      return await this.prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId,
            platform: SocialPlatform.TWITTER,
          },
        },
        update: {
          accountId: twitterUser.id,
          username: twitterUser.username,
          picture: twitterUser.picture,
          accessToken,
          refreshToken,
          expiresAt,
        },
        create: {
          userId,
          platform: SocialPlatform.TWITTER,
          accountId: twitterUser.id,
          username: twitterUser.username,
          picture: twitterUser.picture,
          accessToken,
          refreshToken,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Error connecting Twitter account:", error);
      throw error;
    }
  }

  async refreshTokenIfNeeded(userId: string) {
    try {
      const socialAccount = await this.prisma.socialAccount.findUnique({
        where: {
          userId_platform: {
            userId,
            platform: SocialPlatform.TWITTER,
          },
        },
      });

      if (!socialAccount) {
        throw new Error("No Twitter account found for user");
      }

      // Check if token needs refresh (1 day buffer)
      const shouldRefresh = socialAccount.expiresAt
        ? socialAccount.expiresAt < addDays(new Date(), 1)
        : true;

      if (shouldRefresh && socialAccount.refreshToken) {
        const { accessToken, refreshToken } =
          await this.client.refreshOAuth2Token(socialAccount.refreshToken);

        // Update tokens in database
        return await this.prisma.socialAccount.update({
          where: {
            id: socialAccount.id,
          },
          data: {
            accessToken,
            refreshToken,
            expiresAt: addDays(new Date(), TwitterService.TOKEN_EXPIRY_DAYS),
          },
        });
      }

      return socialAccount;
    } catch (error) {
      console.error("Error refreshing Twitter token:", error);
      throw error;
    }
  }

  async disconnectAccount(userId: string) {
    try {
      const socialAccount = await this.prisma.socialAccount.findUnique({
        where: {
          userId_platform: {
            userId,
            platform: SocialPlatform.TWITTER,
          },
        },
      });

      if (!socialAccount) {
        throw new Error("No Twitter account found for user");
      }

      // Revoke tokens if they exist
      if (socialAccount.accessToken) {
        await this.client.revokeOAuth2Token(
          socialAccount.accessToken,
          "access_token"
        );
      }

      // Delete the social account record
      await this.prisma.socialAccount.delete({
        where: {
          id: socialAccount.id,
        },
      });

      return true;
    } catch (error) {
      console.error("Error disconnecting Twitter account:", error);
      throw error;
    }
  }
}
