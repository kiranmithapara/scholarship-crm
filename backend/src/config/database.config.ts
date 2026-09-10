import { Sequelize } from "sequelize";
import { env } from "./env.config";
import { logger } from "./logger.config";

/**
 * Sequelize instance - single connection pool shared across the whole app.
 * SQL logging is disabled in all environments to keep console clean.
 * Queries can be logged to file via `logQuery` if needed, but not by default.
 */
export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: false, // <-- SQL queries won't show in console
  dialectOptions: env.db.ssl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true,
  },
});

/** Verifies the DB connection is alive. Called once on server boot. */
export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");
  } catch (error) {
    logger.error("Unable to connect to PostgreSQL:", error);
    throw error;
  }
}