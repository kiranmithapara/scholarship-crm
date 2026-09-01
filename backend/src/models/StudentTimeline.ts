import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { Student } from "./Student";
import { User } from "./User";

export type TimelineEvent =
  | "application_submitted"
  | "verified"
  | "receipt_uploaded"
  | "correction_requested"
  | "completed";

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
      type: DataTypes.ENUM("application_submitted", "verified", "receipt_uploaded", "correction_requested", "completed"),
      allowNull: false,
    },
    note: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: "student_timelines", modelName: "StudentTimeline", timestamps: true, updatedAt: false, paranoid: false }
);
