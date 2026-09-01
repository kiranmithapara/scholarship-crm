import { createApp } from "@/app";
import { env } from "@/config/env.config";
import { sequelize } from "@/config/database.config";
import { initDatabase } from "@/database";
import { verifyMailTransporter } from "@/config/nodemailer.config";
import { logger } from "@/config/logger.config";

/**
 * Server entry point.
 * Boot sequence: connect DB -> verify mail -> start listening.
 * If the DB connection fails, the process exits immediately - the app should
 * never run in a half-broken state where the DB is unreachable.
 */
async function startServer(): Promise<void> {
  try {
    await initDatabase();

    // SMTP verification runs in the background, deliberately NOT awaited - a slow or
    // misconfigured mail server should never delay or block the app from starting.
    verifyMailTransporter().catch(() => {});

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`API available at http://localhost:${env.PORT}${env.API_PREFIX}`);
    });

    // ---------- Graceful Shutdown ----------
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await sequelize.close();
        logger.info("Database connection closed. Process terminated.");
        process.exit(0);
      });

      // Force-exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Promise Rejection:", reason);
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
