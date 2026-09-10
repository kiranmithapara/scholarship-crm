import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { env } from "./env.config";

/**
 * Winston logger - structured logging across the app.
 * Console: level-only colorized (info=green, warn=yellow, error=red),
 * message and timestamp remain plain text (no color).
 * Files: JSON, daily-rotated, split into combined + error-only.
 */

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  // Only the level label gets colored, not the entire message
  winston.format.colorize({ level: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const logsDir = path.join(process.cwd(), "logs");

export const logger = winston.createLogger({
  level: env.isProduction ? "info" : "info",
  format: fileFormat,
  defaultMeta: { service: "scholarship-crm-backend" },
  transports: [
    new DailyRotateFile({
      dirname: logsDir,
      filename: "combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      format: fileFormat,
    }),
  ],
});

logger.add(new winston.transports.Console({ format: consoleFormat }));

export const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};