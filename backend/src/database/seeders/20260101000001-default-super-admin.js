"use strict";
const bcrypt = require("bcrypt");

/**
 * Seeds the very first Super Admin account so someone can actually log into
 * a freshly-deployed system. Password MUST be changed immediately after first login
 * (change_password_required flag pattern can be added later if needed).
 *
 * Default credentials (CHANGE IMMEDIATELY IN PRODUCTION):
 *   email:    admin@scholarshipcrm.com
 *   username: superadmin
 *   password: Admin@12345
 */
module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@scholarshipcrm.com' LIMIT 1;`
    );
    if (existing && existing.length > 0) return;

    const hashedPassword = await bcrypt.hash("Admin@12345", 12);

    await queryInterface.bulkInsert("users", [
      {
        id: queryInterface.sequelize.literal("gen_random_uuid()"),
        full_name: "Super Admin",
        mobile: "9999999999",
        email: "admin@scholarshipcrm.com",
        username: "superadmin",
        password: hashedPassword,
        role: "super_admin",
        is_active: true,
        is_email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete("users", { email: "admin@scholarshipcrm.com" });
  },
};
