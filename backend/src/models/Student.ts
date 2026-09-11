import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { User } from "./User";

// V2 UPGRADE: "plan" (2500/5000) renamed to "service_type" (prepaid/postpaid).
export type ServiceType = "prepaid" | "postpaid";
export type StudentStatus = "pending" | "verified" | "completed" | "correction_requested";

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
  declare serviceType: ServiceType;
  declare status: CreationOptional<StudentStatus>;
  declare correctionNote: string | null;
  declare buyingPrice: string | null;
  declare sellingPrice: string | null;
  declare partnerProfit: string | null;
  declare referralPartnerId: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  // V7 NEW: soft delete timestamp (enabled by `paranoid: true` below)
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
    serviceType: { type: DataTypes.ENUM("prepaid", "postpaid"), allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "verified", "completed", "correction_requested"),
      allowNull: false,
      defaultValue: "pending",
    },
    correctionNote: { type: DataTypes.TEXT, allowNull: true },
    buyingPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    sellingPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    partnerProfit: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    referralPartnerId: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "students",
    modelName: "Student",
    paranoid: true, // V7 NEW: enables soft delete (uses deletedAt column)
  }
);