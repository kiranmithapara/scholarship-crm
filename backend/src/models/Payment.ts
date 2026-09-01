import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { Student } from "./Student";

export type PaymentStatus = "pending" | "completed" | "failed";

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<string>;
  declare studentId: ForeignKey<Student["id"]>;
  declare amount: number;
  declare status: CreationOptional<PaymentStatus>;
  declare transactionId: string | null;
  declare receiptUrl: string | null;
  declare paidAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Payment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM("pending", "completed", "failed"), allowNull: false, defaultValue: "pending" },
    transactionId: { type: DataTypes.STRING(150), allowNull: true },
    receiptUrl: { type: DataTypes.STRING, allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "payments", modelName: "Payment", timestamps: true, paranoid: false }
);
