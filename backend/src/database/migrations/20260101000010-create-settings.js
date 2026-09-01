"use strict";
/** Settings table - singleton row (id always 1) holding site-wide config editable by Super Admin. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("settings", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: false, defaultValue: 1 },
      website_name: { type: Sequelize.STRING(150), allowNull: false, defaultValue: "Scholarship CRM" },
      logo_url: { type: Sequelize.STRING, allowNull: true },
      smtp_host: { type: Sequelize.STRING, allowNull: true },
      smtp_port: { type: Sequelize.INTEGER, allowNull: true },
      smtp_user: { type: Sequelize.STRING, allowNull: true },
      smtp_password_encrypted: { type: Sequelize.STRING, allowNull: true }, // AES-encrypted, never plain text
      firebase_storage_bucket: { type: Sequelize.STRING, allowNull: true },
      allowed_ips: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      default_theme: { type: Sequelize.ENUM("light", "dark"), allowNull: false, defaultValue: "light" },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
      // Seed the single settings row immediately - app.settings always assumes id=1 exists.
    // Raw SQL used here (not bulkInsert) because Postgres cannot infer the element type of an
    // empty array literal without an explicit cast - bulkInsert has no way to express that cast.
    await queryInterface.sequelize.query(`
      INSERT INTO settings (id, website_name, allowed_ips, default_theme, updated_at)
      VALUES (1, 'Scholarship CRM', ARRAY[]::VARCHAR[], 'light', NOW());
    `);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("settings");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_settings_default_theme";');
  },
};
