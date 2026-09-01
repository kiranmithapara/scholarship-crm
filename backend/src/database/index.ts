import "@/models"; // side-effect import - registers all models + associations onto the sequelize instance
import { connectDatabase } from "@/config/database.config";
import { logger } from "@/config/logger.config";

/**
 * Database bootstrap - called once from server.ts before the HTTP server starts listening.
 * Only verifies the connection; actual schema changes are ALWAYS done via
 * `npm run db:migrate` (sequelize-cli), never via sequelize.sync() in production.
 */
export async function initDatabase(): Promise<void> {
  await connectDatabase();
  logger.info("All models and associations registered.");
}
