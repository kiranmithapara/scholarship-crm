"use strict";
/** Login Logs table - powers "Login Logs" page (Super Admin only). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("login_logs", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true, // nullable - failed logins with a wrong email won't have a matching user
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      email_attempted: { type: Sequelize.STRING(150), allowNull: false },
      ip_address: { type: Sequelize.STRING(45), allowNull: false }, // IPv6-safe length
      browser: { type: Sequelize.STRING(100), allowNull: true },
      device: { type: Sequelize.STRING(100), allowNull: true },
      status: { type: Sequelize.ENUM("success", "failed"), allowNull: false },
      failure_reason: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("login_logs", ["user_id"]);
    await queryInterface.addIndex("login_logs", ["created_at"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("login_logs");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_login_logs_status";');
  },
};
