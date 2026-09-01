import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { User } from "./User";

export type StudentPlan = "2500" | "5000";
export type StudentStatus = "pending" | "verified" | "completed" | "correction_requested";
export type ScholarshipStatus = "pending" | "approved" | "rejected";

/** Student model - the core entity every other module (documents, payments, timeline, commission) hangs off of. */
export class Student extends Model<InferAttributes<Student>, InferCreationAttributes<Student>> {
  declare id: CreationOptional<string>;
  declare fullName: string;
  declare mobile: string;
  declare gender: "male" | "female" | "other";
  declare collegeName: string;
  declare universityName: string;
  declare course: string;
  declare semester: string;
  declare plan: StudentPlan;
  declare status: CreationOptional<StudentStatus>;
  declare mysyRegistrationNumber: string | null;
  declare mysyPassword: string | null;
  declare scholarshipStatus: CreationOptional<ScholarshipStatus>;
  declare correctionNote: string | null;
  declare referralPartnerId: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

Student.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fullName: { type: DataTypes.STRING(150), allowNull: false },
    mobile: { type: DataTypes.STRING(15), allowNull: false },
    gender: { type: DataTypes.ENUM("male", "female", "other"), allowNull: false },
    collegeName: { type: DataTypes.STRING(200), allowNull: false },
    universityName: { type: DataTypes.STRING(200), allowNull: false },
    course: { type: DataTypes.STRING(150), allowNull: false },
    semester: { type: DataTypes.STRING(20), allowNull: false },
    plan: { type: DataTypes.ENUM("2500", "5000"), allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "verified", "completed", "correction_requested"),
      allowNull: false,
      defaultValue: "pending",
    },
    mysyRegistrationNumber: { type: DataTypes.STRING(100), allowNull: true },
    mysyPassword: { type: DataTypes.STRING(100), allowNull: true },
    scholarshipStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    correctionNote: { type: DataTypes.TEXT, allowNull: true },
    referralPartnerId: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "students", modelName: "Student" }
);
