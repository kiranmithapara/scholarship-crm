"use strict";
/**
 * V2 UPGRADE: Adds admin_amount to commissions - the Super Admin's OWN earning on the
 * application (the partner's buyingPrice, i.e. what the partner pays the admin for the
 * Hostel Receipt), tracked alongside the existing `amount` (the Referral Partner's profit).
 * Backfilled from students.buying_price for any commission rows that already exist, so
 * historical data isn't left at 0.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("commissions", "admin_amount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    // Backfill existing commission rows from the student's already-snapshotted buying_price
    await queryInterface.sequelize.query(`
      UPDATE commissions
      SET admin_amount = COALESCE(students.buying_price, 0)
      FROM students
      WHERE students.id = commissions.student_id
    `);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("commissions", "admin_amount");
  },
};
