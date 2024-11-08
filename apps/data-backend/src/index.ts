import Fastify from "fastify";
import fs from "fs";
import fastifyCors from "@fastify/cors";
import fastifyIO from "fastify-socket.io";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { config } from "./config";
import { setupWebSocket } from "./services/livestream/socket";
import { authRoutes } from "./routes/auth";
import { indexerRoutes } from "./routes/indexer/index";
import authPlugin from "./plugins/auth";
import jwt from "jsonwebtoken";
import prismaPlugin from "./plugins/prisma";
import { launchBot } from "./services/telegram-app";
import declareRoutes from "./router";

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

  // Register core plugins
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  //Middleware to verify JWT
  const JWT_SECRET = config.jwt.secret;
  fastify.decorate("verifyJWT", async (request, reply) => {
    try {
      const token = request.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      request.user = decoded;
    } catch (error) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  // Register routes
  // Auth
  // await fastify.register(authRoutes);
  // Indexer
  await declareRoutes(fastify)

  // Initialize WebSocket handlers
  fastify.ready((err) => {
    if (err) throw err;
    setupWebSocket(fastify.io);
  });

  return fastify;
}

let server: any = null;

async function start() {
  try {
    server = await buildServer();
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

// Graceful shutdown handling
async function shutdown() {
  console.log("Received shutdown signal");
  if (server) {
    try {
      await server.close();
      console.log("Server closed successfully");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  }
}

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGHUP", shutdown);

// Start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  start();
}

export { buildServer };
