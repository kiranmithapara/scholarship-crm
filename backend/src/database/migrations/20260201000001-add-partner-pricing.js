"use strict";
/**
 * V2 UPGRADE: Adds per-partner pricing for the two service types.
 * Only Super Admin can edit these - the buying (cost) price a Referral Partner pays
 * for Prepaid vs Postpaid service. Nullable so existing partners aren't broken;
 * Super Admin fills these in via the (upgraded) Partner Profile page.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "prepaid_cost", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "postpaid_cost", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "prepaid_cost");
    await queryInterface.removeColumn("users", "postpaid_cost");
  },
};
