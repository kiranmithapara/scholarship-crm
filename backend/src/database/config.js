// Plain JS config for sequelize-cli (CLI can't read our TS env.config.ts directly).
// Reads the same .env file so migration/seed commands use identical DB credentials
// as the actual running app.
require("dotenv").config();

const base = {
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "scholarship_crm",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  define: { underscored: true, timestamps: true, paranoid: true },
};

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: {
    ...base,
    dialectOptions:
      process.env.DB_SSL === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  },
};
