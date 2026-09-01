"use strict";
/** Activity Logs table - powers "Activity Logs" page (Super Admin only) - who did what, when. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("activity_logs", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      action: { type: Sequelize.STRING(150), allowNull: false }, // e.g. "STUDENT_CREATED", "APPLICATION_VERIFIED"
      details: { type: Sequelize.JSONB, allowNull: true }, // arbitrary structured context for the action
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("activity_logs", ["user_id"]);
    await queryInterface.addIndex("activity_logs", ["action"]);
    await queryInterface.addIndex("activity_logs", ["created_at"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("activity_logs");
  },
};
