import "@/models"; // side-effect import - registers all models + associations onto the sequelize instance
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { StudentTimeline } from "@/models/StudentTimeline";
import bcrypt from "bcrypt";
import { QueryTypes } from "sequelize";
import { connectDatabase, sequelize } from "@/config/database.config";
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

/**
 * Automatically repairs any historical records where a student was marked "completed"
 * but their commission/payment is currently "pending" (e.g. reversed prior to the fix).
 */
async function syncStudentCommissionStatuses(): Promise<void> {
  try {
    const outOfSyncStudents = await sequelize.query<any>(
      `SELECT s.id, s.service_type AS "serviceType"
       FROM students s
       INNER JOIN commissions c ON c.student_id = s.id
       WHERE s.status = 'completed' AND c.status = 'pending' AND s.deleted_at IS NULL;`,
      { type: QueryTypes.SELECT }
    );

    for (const row of outOfSyncStudents) {
      let targetStatus = "pending";
      if (row.serviceType === "postpaid") {
        const verifiedTimeline = await StudentTimeline.findOne({
          where: { studentId: row.id, event: "help_center_verification_completed" },
        });
        targetStatus = verifiedTimeline ? "verified" : "pending";
      }
      await Student.update({ status: targetStatus as any }, { where: { id: row.id } });
      logger.info(`Auto-synced pending student ${row.id} status to: ${targetStatus}`);
    }
  } catch (error) {
    logger.warn("Could not sync student commission statuses on boot:", error);
  }
}

export async function initDatabase(): Promise<void> {
  await connectDatabase();
  logger.info("All models and associations registered.");
  await ensureDefaultSuperAdmin();
  await syncStudentCommissionStatuses();
}

