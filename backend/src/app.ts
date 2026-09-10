import express, { type Application } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";

import { env } from "@/config/env.config";
import { morganStream } from "@/config/logger.config";
import { generalRateLimiter } from "@/middlewares/rateLimiter.middleware";
import { errorMiddleware, notFoundMiddleware } from "@/middlewares/error.middleware";
import routes from "@/routes";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  const allowedOrigins = (env.CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.length === 0 ||
          allowedOrigins.includes(origin) ||
          origin === "https://scholarship-crm.vercel.app" ||
          origin.endsWith(".vercel.app") ||
          origin.includes("localhost")
        ) {
          return callback(null, true);
        }
        return callback(new Error("CORS Policy: Origin not allowed"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(hpp());
  app.use(mongoSanitize());

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  app.use(compression());

  // Concise HTTP logging: ":method :url :status :response-time ms"
  app.use(
    morgan(":method :url :status :response-time ms", { stream: morganStream })
  );

  app.use(env.API_PREFIX, generalRateLimiter);

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(env.API_PREFIX, routes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}