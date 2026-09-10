import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { User } from "./User";

/**
 * V6 NEW: AdminNote model - Super Admin's personal notes (notepad).
 * Private to the user who created them.
 */
export class AdminNote extends Model<InferAttributes<AdminNote>, InferCreationAttributes<AdminNote>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User["id"]>;
  declare title: string | null;
  declare note: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AdminNote.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "admin_notes", modelName: "AdminNote", timestamps: true, paranoid: false }
);

export default AdminNote;