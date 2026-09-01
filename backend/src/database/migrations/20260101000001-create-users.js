"use strict";
/** Users table - both Super Admin and Referral Admin live here, differentiated by `role`. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      mobile: { type: Sequelize.STRING(15), allowNull: false, unique: true },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false }, // bcrypt hash, never plain text
      role: { type: Sequelize.ENUM("super_admin", "referral_admin"), allowNull: false, defaultValue: "referral_admin" },
      photo_url: { type: Sequelize.STRING, allowNull: true }, // Firebase Storage URL only
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_email_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true }, // soft delete (paranoid)
    });
    await queryInterface.addIndex("users", ["role"]);
    await queryInterface.addIndex("users", ["is_active"]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("users");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};
