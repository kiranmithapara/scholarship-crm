import { Sequelize } from "sequelize";
import { env } from "./env.config";
import { logger } from "./logger.config";

/**
 * Sequelize instance - single connection pool shared across the whole app.
 * Models register themselves against this instance (see models/index.ts).
 */
export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.isDevelopment ? (sql) => logger.debug(sql) : false,
  dialectOptions: env.db.ssl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // needed for most managed Postgres providers (Render, Railway, etc.)
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
    // snake_case columns in DB, camelCase in JS - Sequelize maps automatically
    underscored: true,
    timestamps: true,
    paranoid: true, // soft deletes by default - deleted_at column, never hard-delete scholarship records
  },
});

/** Verifies the DB connection is alive. Called once on server boot. */
export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connection established successfully.");
  } catch (error) {
    logger.error("Unable to connect to PostgreSQL:", error);
    throw error;
  }
}
