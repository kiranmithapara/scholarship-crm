import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { User } from "./User";
import { Student } from "./Student";

export type CommissionStatus = "pending" | "paid";

export class Commission extends Model<InferAttributes<Commission>, InferCreationAttributes<Commission>> {
  declare id: CreationOptional<string>;
  declare referralPartnerId: ForeignKey<User["id"]>;
  declare studentId: ForeignKey<Student["id"]>;
  declare amount: number;
  // V2 NEW: Super Admin's own earning on this application = the partner's buyingPrice
  // (what the partner pays the admin), snapshotted at verify time. `amount` above stays the
  // Referral Partner's profit (sellingPrice - buyingPrice) - the two are tracked side by side
  // on the same row so a single status/paidAt update moves both admin and partner books together.
  declare adminAmount: CreationOptional<number>;
  declare status: CreationOptional<CommissionStatus>;
  declare paidAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Commission.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    referralPartnerId: { type: DataTypes.UUID, allowNull: false },
    studentId: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    adminAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM("pending", "paid"), allowNull: false, defaultValue: "pending" },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "commissions", modelName: "Commission", timestamps: true, paranoid: false }
);
