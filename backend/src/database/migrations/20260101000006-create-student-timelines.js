"use strict";
/** Student Timelines table - powers the "Timeline" tab (Submitted -> Verified -> Receipt Uploaded -> Completed). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("student_timelines", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "students", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      event: {
        type: Sequelize.ENUM("application_submitted", "verified", "receipt_uploaded", "correction_requested", "completed"),
        allowNull: false,
      },
      note: { type: Sequelize.TEXT, allowNull: true },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("student_timelines", ["student_id"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("student_timelines");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_student_timelines_event";');
  },
};
