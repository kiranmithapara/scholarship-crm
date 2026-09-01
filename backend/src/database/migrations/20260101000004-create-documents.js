"use strict";
/** Documents table - stores ONLY Firebase Storage URLs, never binary/base64 file data. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("documents", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "students", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // student deleted -> its document records go too (files cleaned via service)
      },
      type: {
        type: Sequelize.ENUM("aadhaar", "hostel_receipt", "twelfth_marksheet"),
        allowNull: false,
      },
      file_url: { type: Sequelize.STRING, allowNull: false }, // Firebase Storage download URL
      file_name: { type: Sequelize.STRING, allowNull: false },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("documents", ["student_id"]);
    // A student should never have two active documents of the same type
    await queryInterface.addConstraint("documents", {
      fields: ["student_id", "type"],
      type: "unique",
      name: "unique_student_document_type",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("documents");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_type";');
  },
};
