import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "@/config/database.config";

export type OtpPurpose = "email_verification" | "forgot_password";

export class Otp extends Model<InferAttributes<Otp>, InferCreationAttributes<Otp>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare code: string;
  declare purpose: OtpPurpose;
  declare isUsed: CreationOptional<boolean>;
  declare expiresAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Otp.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false },
    purpose: { type: DataTypes.ENUM("email_verification", "forgot_password"), allowNull: false },
    isUsed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "otps", modelName: "Otp", timestamps: true, paranoid: false }
);
