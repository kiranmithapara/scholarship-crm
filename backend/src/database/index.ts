import "@/models"; // side-effect import - registers all models + associations onto the sequelize instance
import { User } from "@/models/User";
import bcrypt from "bcrypt";
import { connectDatabase } from "@/config/database.config";
import { logger } from "@/config/logger.config";

/**
 * Ensures the default Super Admin exists if the database is freshly initialized
 * so login is immediately available in production (e.g. Render deployments).
 */
async function ensureDefaultSuperAdmin(): Promise<void> {
  try {
    const existingAdmin = await User.findOne({
      where: { email: "admin@scholarshipcrm.com" },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Admin@12345", 12);
      await User.create({
        fullName: "Super Admin",
        mobile: "9999999999",
        email: "admin@scholarshipcrm.com",
        username: "superadmin",
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
        isEmailVerified: true,
      });
      logger.info("Default Super Admin created: admin@scholarshipcrm.com / Admin@12345");
    }
  } catch (error) {
    logger.warn("Could not check/create default Super Admin on boot:", error);
  }
}

export async function initDatabase(): Promise<void> {
  await connectDatabase();
  logger.info("All models and associations registered.");
  await ensureDefaultSuperAdmin();
}
