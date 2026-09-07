"use strict";
/**
 * V2 UPGRADE: Replaces the old 5-stage timeline event ENUM with the full 13-stage manual
 * scholarship-progress tracking workflow, plus 2 operational stages carried over
 * (correction_requested, receipt_uploaded) that are still needed by both service types.
 *
 * Postgres does not support dropping/renaming individual ENUM values in place, so the
 * standard safe pattern is used: create the new type, migrate the column across with an
 * explicit old->new value mapping (no data loss), then drop the old type.
 */
const OLD_TO_NEW_MAP = {
  application_submitted: "application_filled",
  verified: "help_center_verification_completed",
  receipt_uploaded: "receipt_uploaded",
  correction_requested: "correction_requested",
  completed: "case_completed",
};

const NEW_STAGES = [
  "application_filled",
  "application_locked_by_student",
  "documents_submitted",
  "help_center_verification_completed",
  "commissioner_verification",
  "query_raised",
  "query_resolved",
  "scholarship_approved",
  "scholarship_amount_credited",
  "payment_pending",
  "payment_received",
  "payment_verified",
  "case_completed",
  // Operational stages carried over from V1, still used by both service types:
  "correction_requested",
  "receipt_uploaded",
];

const OLD_STAGES = ["application_submitted", "verified", "receipt_uploaded", "correction_requested", "completed"];

module.exports = {
  up: async (queryInterface) => {
    const sql = queryInterface.sequelize;

    await sql.query('ALTER TYPE "enum_student_timelines_event" RENAME TO "enum_student_timelines_event_old";');
    await sql.query(`CREATE TYPE "enum_student_timelines_event" AS ENUM(${NEW_STAGES.map((s) => `'${s}'`).join(", ")});`);

    const caseWhen = Object.entries(OLD_TO_NEW_MAP)
      .map(([oldVal, newVal]) => `WHEN '${oldVal}' THEN '${newVal}'`)
      .join(" ");

    await sql.query(`
      ALTER TABLE student_timelines
      ALTER COLUMN event TYPE "enum_student_timelines_event"
      USING (
        CASE event::text
          ${caseWhen}
          ELSE 'application_filled'
        END
      )::"enum_student_timelines_event";
    `);

    await sql.query('DROP TYPE "enum_student_timelines_event_old";');
  },

  down: async (queryInterface) => {
    const sql = queryInterface.sequelize;
    const reverseMap = Object.fromEntries(Object.entries(OLD_TO_NEW_MAP).map(([oldVal, newVal]) => [newVal, oldVal]));

    await sql.query('ALTER TYPE "enum_student_timelines_event" RENAME TO "enum_student_timelines_event_new";');
    await sql.query(`CREATE TYPE "enum_student_timelines_event" AS ENUM(${OLD_STAGES.map((s) => `'${s}'`).join(", ")});`);

    const caseWhen = Object.entries(reverseMap)
      .map(([newVal, oldVal]) => `WHEN '${newVal}' THEN '${oldVal}'`)
      .join(" ");

    await sql.query(`
      ALTER TABLE student_timelines
      ALTER COLUMN event TYPE "enum_student_timelines_event"
      USING (
        CASE event::text
          ${caseWhen}
          ELSE 'application_submitted'
        END
      )::"enum_student_timelines_event";
    `);

    await sql.query('DROP TYPE "enum_student_timelines_event_new";');
  },
};
