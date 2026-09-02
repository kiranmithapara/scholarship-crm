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

/**
 * Express App Bootstrap.
 * Middleware order matters - security/parsing middlewares run before routes,
 * error handlers are always LAST.
 */
export function createApp(): Application {
  const app = express();

  // Trust first proxy (Render/Vercel sit behind a reverse proxy) - needed for correct req.ip
  // and secure cookies to work properly behind HTTPS termination.
  app.set("trust proxy", 1);

  // ---------- Security ----------
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // allows Firebase-hosted images to load
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

  // Prevents HTTP Parameter Pollution (?role=admin&role=hacker style attacks)
  app.use(hpp());

  // Strips any keys starting with "$" or containing "." from req.body/query/params -
  // defends against NoSQL/operator injection attempts even though we use PostgreSQL
  app.use(mongoSanitize());

  // ---------- Body Parsing ----------
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // ---------- Performance ----------
  app.use(compression());

  // ---------- Logging ----------
  app.use(morgan(env.isProduction ? "combined" : "dev", { stream: morganStream }));

  // ---------- Rate Limiting ----------
  app.use(env.API_PREFIX, generalRateLimiter);

  // ---------- Static Files (Uploads Fallback) ----------
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // ---------- Routes ----------
  app.use(env.API_PREFIX, routes);

  // ---------- 404 + Global Error Handler (must be last) ----------
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
