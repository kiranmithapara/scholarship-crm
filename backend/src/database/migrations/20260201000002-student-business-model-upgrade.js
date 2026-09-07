"use strict";
/**
 * V2 UPGRADE: Core business-model migration for the students table.
 *
 * 1. Renames `plan` ('2500'/'5000') -> `service_type` ('prepaid'/'postpaid'), preserving
 *    every existing row's data via an explicit backfill UPDATE (no data loss).
 * 2. Removes MYSY government-portal fields entirely (mysy_registration_number,
 *    mysy_password, scholarship_status) - this CRM no longer tracks MYSY directly;
 *    scholarship progress is now tracked via the expanded student_timelines stages
 *    (see migration 20260201000003).
 * 3. Adds buying_price / selling_price / partner_profit - the per-application financials
 *    the Referral Partner enters (selling_price) against what Super Admin has set as that
 *    partner's cost for the service type (buying_price), with profit auto-computed.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ---------- Step 1: plan -> service_type (data-preserving rename) ----------
    await queryInterface.addColumn("students", "service_type", {
      type: Sequelize.ENUM("prepaid", "postpaid"),
      allowNull: true, // temporarily nullable during backfill, tightened below
    });

    await queryInterface.sequelize.query(`
      UPDATE students
      SET service_type = (CASE
        WHEN plan = '2500' THEN 'prepaid'
        WHEN plan = '5000' THEN 'postpaid'
        ELSE 'prepaid'
      END)::"enum_students_service_type";
    `);

    await queryInterface.changeColumn("students", "service_type", {
      type: Sequelize.ENUM("prepaid", "postpaid"),
      allowNull: false,
    });

    await queryInterface.removeIndex("students", ["plan"]);
    await queryInterface.removeColumn("students", "plan");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_plan";');
    await queryInterface.addIndex("students", ["service_type"]);

    // ---------- Step 2: remove MYSY fields ----------
    await queryInterface.removeIndex("students", ["scholarship_status"]);
    await queryInterface.removeColumn("students", "mysy_registration_number");
    await queryInterface.removeColumn("students", "mysy_password");
    await queryInterface.removeColumn("students", "scholarship_status");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_scholarship_status";');

    // ---------- Step 3: add financial fields ----------
    await queryInterface.addColumn("students", "buying_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true, // existing rows have no historical price data
    });
    await queryInterface.addColumn("students", "selling_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("students", "partner_profit", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true, // computed as selling_price - buying_price at creation time (see student.service.ts)
    });
  },

  down: async (queryInterface, Sequelize) => {
    // ---------- Reverse Step 3 ----------
    await queryInterface.removeColumn("students", "partner_profit");
    await queryInterface.removeColumn("students", "selling_price");
    await queryInterface.removeColumn("students", "buying_price");

    // ---------- Reverse Step 2 ----------
    await queryInterface.addColumn("students", "scholarship_status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    });
    await queryInterface.addColumn("students", "mysy_password", { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addColumn("students", "mysy_registration_number", { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addIndex("students", ["scholarship_status"]);

    // ---------- Reverse Step 1 ----------
    await queryInterface.addColumn("students", "plan", {
      type: Sequelize.ENUM("2500", "5000"),
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE students
      SET plan = (CASE WHEN service_type = 'prepaid' THEN '2500' ELSE '5000' END)::"enum_students_plan";
    `);
    await queryInterface.changeColumn("students", "plan", {
      type: Sequelize.ENUM("2500", "5000"),
      allowNull: false,
    });
    await queryInterface.addIndex("students", ["plan"]);
    await queryInterface.removeIndex("students", ["service_type"]);
    await queryInterface.removeColumn("students", "service_type");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_service_type";');
  },
};
