"use strict";
/** Payments table - the ₹2500/₹5000 receipt payment tracked per student. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("payments", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "students", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: { type: Sequelize.ENUM("pending", "completed", "failed"), allowNull: false, defaultValue: "pending" },
      transaction_id: { type: Sequelize.STRING(150), allowNull: true },
      receipt_url: { type: Sequelize.STRING, allowNull: true }, // Firebase URL of uploaded receipt
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("payments", ["student_id"]);
    await queryInterface.addIndex("payments", ["status"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("payments");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
  },
};
