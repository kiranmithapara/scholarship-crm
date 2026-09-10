"use strict";
/**
 * V6 NEW: admin_notes table - Super Admin's personal notes (notepad/diary).
 * Each note belongs to a user (typically Super Admin) and is private to them.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("admin_notes", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      title: { type: Sequelize.STRING(200), allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("admin_notes", ["user_id"]);
    await queryInterface.addIndex("admin_notes", ["created_at"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("admin_notes");
  },
};