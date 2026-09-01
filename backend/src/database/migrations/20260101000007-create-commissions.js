"use strict";
/** Commissions table - what a Referral Admin earns per completed student application. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("commissions", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      referral_partner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "students", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: { type: Sequelize.ENUM("pending", "paid"), allowNull: false, defaultValue: "pending" },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("commissions", ["referral_partner_id"]);
    await queryInterface.addIndex("commissions", ["status"]);
    // One commission record per student - avoids double-counting the same application
    await queryInterface.addConstraint("commissions", {
      fields: ["student_id"],
      type: "unique",
      name: "unique_commission_per_student",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("commissions");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_commissions_status";');
  },
};
