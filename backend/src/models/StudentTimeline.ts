import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { Student } from "./Student";
import { User } from "./User";

/**
 * V2 UPGRADE: Expanded from 5 generic events to the full 13-stage manual scholarship-progress
 * workflow (Application Filled -> Case Completed), plus 2 operational stages carried over from V1
 * that are still needed by both service types (correction_requested, receipt_uploaded).
 * Every stage change is entered manually by Super Admin/Referral Partner - there is no automation.
 */
export type TimelineEvent =
  | "application_filled"
  | "application_locked_by_student"
  | "documents_submitted"
  | "help_center_verification_completed"
  | "commissioner_verification"
  | "query_raised"
  | "query_resolved"
  | "scholarship_approved"
  | "scholarship_amount_credited"
  | "payment_pending"
  | "payment_received"
  | "payment_verified"
  | "case_completed"
  | "correction_requested"
  | "receipt_uploaded";

export class StudentTimeline extends Model<InferAttributes<StudentTimeline>, InferCreationAttributes<StudentTimeline>> {
  declare id: CreationOptional<string>;
  declare studentId: ForeignKey<Student["id"]>;
  declare event: TimelineEvent;
  declare note: string | null;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
}

StudentTimeline.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    event: {
      type: DataTypes.ENUM(
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
        "correction_requested",
        "receipt_uploaded"
      ),
      allowNull: false,
    },
    note: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: "student_timelines", modelName: "StudentTimeline", timestamps: true, updatedAt: false, paranoid: false }
);
