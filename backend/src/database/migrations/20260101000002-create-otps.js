"use strict";
/** OTPs table - short-lived codes for email verification and forgot-password flows. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("otps", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING(150), allowNull: false },
      code: { type: Sequelize.STRING(10), allowNull: false },
      purpose: { type: Sequelize.ENUM("email_verification", "forgot_password"), allowNull: false },
      is_used: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("otps", ["email", "purpose"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("otps");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_otps_purpose";');
  },
};
