"use strict";
/**
 * Students table - core entity of the CRM.
 * referral_partner_id links to the users table (role=referral_admin) - this is how
 * "My Students" (referral admin) vs "All Students" (super admin) scoping works everywhere.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("students", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      mobile: { type: Sequelize.STRING(15), allowNull: false },
      gender: { type: Sequelize.ENUM("male", "female", "other"), allowNull: false },
      college_name: { type: Sequelize.STRING(200), allowNull: false },
      university_name: { type: Sequelize.STRING(200), allowNull: false },
      course: { type: Sequelize.STRING(150), allowNull: false },
      semester: { type: Sequelize.STRING(20), allowNull: false },

      plan: { type: Sequelize.ENUM("2500", "5000"), allowNull: false },

      // Overall CRM processing status - drives the Timeline tab
      status: {
        type: Sequelize.ENUM("pending", "verified", "completed", "correction_requested"),
        allowNull: false,
        defaultValue: "pending",
      },

      // MYSY government portal fields (Scholarship tab)
      mysy_registration_number: { type: Sequelize.STRING(100), allowNull: true },
      mysy_password: { type: Sequelize.STRING(100), allowNull: true }, // encrypted at rest, see student.service.ts
      scholarship_status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      correction_note: { type: Sequelize.TEXT, allowNull: true }, // set when Super Admin requests correction

      referral_partner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT", // a partner with students cannot be hard-deleted accidentally
      },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex("students", ["referral_partner_id"]);
    await queryInterface.addIndex("students", ["plan"]);
    await queryInterface.addIndex("students", ["status"]);
    await queryInterface.addIndex("students", ["scholarship_status"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("students");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_gender";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_plan";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_scholarship_status";');
  },
};
