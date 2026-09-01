import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { env } from "./env.config";

/**
 * Winston logger - structured logging across the app.
 * - Console: human-readable, colorized (dev friendly)
 * - Files: JSON, daily-rotated, split into combined + error-only (for log aggregation tools later)
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  })
);

const logsDir = path.join(process.cwd(), "src", "logs");

export const logger = winston.createLogger({
  level: env.isProduction ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "scholarship-crm-backend" },
  transports: [
    new DailyRotateFile({
      dirname: logsDir,
      filename: "combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
    }),
  ],
});

// Console transport only in non-production (production relies on hosting provider's log capture)
if (!env.isProduction) {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
} else {
  logger.add(new winston.transports.Console({ format: logFormat }));
}

/** Morgan HTTP logs stream into Winston at "http" level, keeping one unified log pipeline */
export const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};
