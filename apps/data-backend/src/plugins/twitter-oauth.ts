import fp from "fastify-plugin";
import fastifyOauth2 from "@fastify/oauth2";

export default fp(async (fastify, opts) => {
  // fastify.decorate("oauth2Twitter",
  //     {
  //         name: 'twitterOAuth',
  //         credentials: {
  //             client: {
  //                 id: process.env.TWITTER_API_KEY!,
  //                 secret: process.env.TWITTER_API_SECRET_KEY!,
  //             },
  //             // auth: fastifyOauth2.TWITTER_CONFIGURATION,
  //             auth:{
  //                 authorizeHost: 'https://api.twitter.com',
  //                 authorizePath: '/oauth/authorize',
  //                 tokenHost: 'https://api.twitter.com',
  //                 tokenPath: '/oauth/access_token',
  //             }
  //         },
  //         startRedirectPath: '/auth/login',
  //         // callbackUri: process.env.TWITTER_CALLBACK_URL!,
  //     }
  // )
  // fastify.register(fastifyOauth2, {
  //     name: 'twitterOAuth',
  //     credentials: {
  //         client: {
  //             id: process.env.TWITTER_API_KEY!,
  //             secret: process.env.TWITTER_API_SECRET_KEY!,
  //         },
  //         // auth: fastifyOauth2.TWITTER_CONFIGURATION,
  //         auth:{
  //             authorizeHost: 'https://api.twitter.com',
  //             authorizePath: '/oauth/authorize',
  //             tokenHost: 'https://api.twitter.com',
  //             tokenPath: '/oauth/access_token',
  //         }
  //     },
  //     startRedirectPath: '/auth/login',
  //     // callbackUri: process.env.TWITTER_CALLBACK_URL!,
  // });
});

declare module "fastify" {
  interface FastifyInstance {
    twitterOAuth: any;
  }
}
