import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { User } from "./User";

export type LoginStatus = "success" | "failed";

/** LoginLog model - every login attempt (successful or failed) is recorded here for the Login Logs page. */
export class LoginLog extends Model<InferAttributes<LoginLog>, InferCreationAttributes<LoginLog>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User["id"]> | null;
  declare emailAttempted: string;
  declare ipAddress: string;
  declare browser: string | null;
  declare device: string | null;
  declare status: LoginStatus;
  declare failureReason: string | null;
  declare createdAt: CreationOptional<Date>;
}

LoginLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    emailAttempted: { type: DataTypes.STRING(150), allowNull: false },
    ipAddress: { type: DataTypes.STRING(45), allowNull: false },
    browser: { type: DataTypes.STRING(100), allowNull: true },
    device: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.ENUM("success", "failed"), allowNull: false },
    failureReason: { type: DataTypes.STRING(255), allowNull: true },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: "login_logs", modelName: "LoginLog", timestamps: true, updatedAt: false, paranoid: false }
);
