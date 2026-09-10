"use strict";
/**
 * V5 NEW: student_notes table - Super Admin's free-form internal notes per student.
 * These notes are strictly internal and NEVER shown to Referral Partners.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("student_notes", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "students", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      note: { type: Sequelize.TEXT, allowNull: false },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("student_notes", ["student_id"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("student_notes");
  },
};