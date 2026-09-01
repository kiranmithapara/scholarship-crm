import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "@/config/database.config";

/** Setting model - singleton row (id=1) for site-wide config, editable only by Super Admin. */
export class Setting extends Model<InferAttributes<Setting>, InferCreationAttributes<Setting>> {
  declare id: CreationOptional<number>;
  declare websiteName: CreationOptional<string>;
  declare logoUrl: string | null;
  declare smtpHost: string | null;
  declare smtpPort: number | null;
  declare smtpUser: string | null;
  declare smtpPasswordEncrypted: string | null;
  declare firebaseStorageBucket: string | null;
  declare allowedIps: CreationOptional<string[]>;
  declare defaultTheme: CreationOptional<"light" | "dark">;
  declare updatedAt: CreationOptional<Date>;
}

Setting.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false, defaultValue: 1 },
    websiteName: { type: DataTypes.STRING(150), allowNull: false, defaultValue: "Scholarship CRM" },
    logoUrl: { type: DataTypes.STRING, allowNull: true },
    smtpHost: { type: DataTypes.STRING, allowNull: true },
    smtpPort: { type: DataTypes.INTEGER, allowNull: true },
    smtpUser: { type: DataTypes.STRING, allowNull: true },
    smtpPasswordEncrypted: { type: DataTypes.STRING, allowNull: true },
    firebaseStorageBucket: { type: DataTypes.STRING, allowNull: true },
    allowedIps: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    defaultTheme: { type: DataTypes.ENUM("light", "dark"), allowNull: false, defaultValue: "light" },
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "settings", modelName: "Setting", timestamps: true, createdAt: false, paranoid: false }
);
