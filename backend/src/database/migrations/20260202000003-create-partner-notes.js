"use strict";
/**
 * V6 NEW: partner_notes table - Super Admin's notes about a specific Referral Partner.
 * E.g., "Jaydeep said he spoke to 4 students yesterday about receipts".
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("partner_notes", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      partner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
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
    await queryInterface.addIndex("partner_notes", ["partner_id"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("partner_notes");
  },
};