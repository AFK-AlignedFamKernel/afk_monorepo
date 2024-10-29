// import Fastify from "fastify";
// import fastifyCors from "@fastify/cors";
// import fastifyIO from "fastify-socket.io";
// import declareRoutes from "./router";
// import authPlugin from "./plugins/auth";
// import prismaPlugin from "./plugins/prisma";
// import { Server as SocketIOServer } from "socket.io";
// import jwt from "jsonwebtoken";
// import { launchBot } from "./services/telegram-app";
// import { NODE_URL } from "./constants/contracts";
// import nodemailer from "nodemailer";
// import bcrypt from "bcryptjs";
// import { Account } from "starknet";
// import twilio from "twilio";

// import path from "path";
// import { setupWebSocket } from "./services/livestream/connection";

// /**
//  * @type {import('fastify').FastifyInstance} Instance of Fastify
//  */

// // Add this type declaration to extend FastifyInstance
// declare module "fastify" {
//   interface FastifyInstance {
//     io: SocketIOServer;
//   }
// }
// const fastify = Fastify({
//   logger: true,
// });
// fastify.register(fastifyCors, {
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// });

// // Then register Socket.IO with matching CORS settings
// fastify.register(fastifyIO, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   },
// });
// export const publicDir = path.join(__dirname, "public");
// fastify.register(require("@fastify/static"), {
//   root: publicDir,
//   prefix: "/public/", // optional: default '/'
// });

// // Register plugins
// fastify.register(prismaPlugin);
// fastify.register(authPlugin);

// // Initialize WebSocket handlers
// fastify.ready((err) => {
//   if (err) throw err;
//   setupWebSocket(fastify.io);
// });

// const JWT_SECRET = process.env.JWT_SECRET;

// // const deployer = new Account({ nodeUrl: NODE_URL }, process.env.ACCOUNT_ADDRESS ?? "", process.env.ACCOUNT_PRIVATE_KEY ?? "")
// // const twilio_services = twilio(process.env.TWILIO_ACCOUNT_SSID, process.env.TWILIO_AUTH_TOKEN).
// // verify.v2.services(
// //   process.env.TWILIO_SERVICE_ID ?? '',
// // )

// declareRoutes(
//   fastify
//   // deployer,
//   // twilio_services
// );

// // Middleware to verify JWT
// fastify.decorate("verifyJWT", async (request, reply) => {
//   try {
//     const token = request.headers.authorization.split(" ")[1];
//     const decoded = jwt.verify(token, JWT_SECRET);
//     request.user = decoded;
//   } catch (error) {
//     reply.code(401).send({ error: "Unauthorized" });
//   }
// });
// const port = Number(process.env.PORT) || 5050;
// const host = process.env.NODE_ENV == "production" ? "0.0.0.0" : "127.0.0.1";

// fastify.listen({ port: port || 5050, host: host }, function (err, address) {
//   if (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }

//   try {
//     launchBot(process.env.TELEGRAM_BOT_TOKEN || "");
//   } catch (error) {
//     console.error("Error launching bot:", error);
//   }
// });

import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyIO from "fastify-socket.io";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { config } from "./config";
import { setupWebSocket } from "./services/livestream/connection";
import { authRoutes } from "./routes/auth";
import authPlugin from "./plugins/auth";
import prismaPlugin from "./plugins/prisma";
import { launchBot } from "./services/telegram-app";

// Type declarations
declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

export const publicDir = path.join(__dirname, "public");

async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  // CORS configuration
  await fastify.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Socket.IO setup
  await fastify.register(fastifyIO, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // Static files setup
  await fastify.register(require("@fastify/static"), {
    root: publicDir,
    prefix: "/public/",
  });

  // Register core plugins
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  // Register routes
  await fastify.register(authRoutes);

  // Initialize WebSocket handlers
  fastify.ready((err) => {
    if (err) throw err;
    setupWebSocket(fastify.io);
  });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    const host =
      process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

    await server.listen({
      port: config.server.port,
      host,
    });

    console.log(`Server listening on ${host}:${config.server.port}`);

    // Launch Telegram bot
    try {
      await launchBot(process.env.TELEGRAM_BOT_TOKEN || "");
    } catch (error) {
      console.error("Error launching bot:", error);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  start();
}

export { buildServer };
