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
    status: { type: DataTypes.ENUM("pending", "paid"), allowNull: false, defaultValue: "pending" },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "commissions", modelName: "Commission", timestamps: true, paranoid: false }
);
