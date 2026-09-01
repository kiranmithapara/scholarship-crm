import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { User } from "./User";

/** ActivityLog model - "who did what, when" audit trail for the Activity Logs page. */
export class ActivityLog extends Model<InferAttributes<ActivityLog>, InferCreationAttributes<ActivityLog>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User["id"]>;
  declare action: string;
  declare details: Record<string, unknown> | null;
  declare ipAddress: string | null;
  declare createdAt: CreationOptional<Date>;
}

ActivityLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(150), allowNull: false },
    details: { type: DataTypes.JSONB, allowNull: true },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: "activity_logs", modelName: "ActivityLog", timestamps: true, updatedAt: false, paranoid: false }
);
