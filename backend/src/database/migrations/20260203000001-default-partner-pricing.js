"use strict";

/**
 * Migration: Sets default Prepaid Cost (1500.00) and Postpaid Cost (4500.00)
 * for referral partners, and backfills any existing partners with null values.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("users", "prepaid_cost", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 1500.0,
    });
    await queryInterface.changeColumn("users", "postpaid_cost", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 4500.0,
    });

    await queryInterface.sequelize.query(`
      UPDATE users
      SET prepaid_cost = 1500.00
      WHERE role = 'referral_admin' AND (prepaid_cost IS NULL OR prepaid_cost = 0);
    `);

    await queryInterface.sequelize.query(`
      UPDATE users
      SET postpaid_cost = 4500.00
      WHERE role = 'referral_admin' AND (postpaid_cost IS NULL OR postpaid_cost = 0);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("users", "prepaid_cost", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.changeColumn("users", "postpaid_cost", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
  },
};
