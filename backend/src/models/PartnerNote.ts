import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { User } from "./User";

/**
 * V6 NEW: PartnerNote model - Super Admin's notes about a specific Referral Partner.
 */
export class PartnerNote extends Model<InferAttributes<PartnerNote>, InferCreationAttributes<PartnerNote>> {
  declare id: CreationOptional<string>;
  declare partnerId: ForeignKey<User["id"]>;
  declare note: string;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PartnerNote.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    partnerId: { type: DataTypes.UUID, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: false },
    createdBy: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "partner_notes", modelName: "PartnerNote", timestamps: true, paranoid: false }
);

export default PartnerNote;