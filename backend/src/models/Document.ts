import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { Student } from "./Student";
import { User } from "./User";

export type DocumentType = "aadhaar" | "hostel_receipt" | "twelfth_marksheet";

export class StudentDocument extends Model<InferAttributes<StudentDocument>, InferCreationAttributes<StudentDocument>> {
  declare id: CreationOptional<string>;
  declare studentId: ForeignKey<Student["id"]>;
  declare type: DocumentType;
  declare fileUrl: string;
  declare fileName: string;
  declare uploadedBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

StudentDocument.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM("aadhaar", "hostel_receipt", "twelfth_marksheet"), allowNull: false },
    fileUrl: { type: DataTypes.STRING, allowNull: false },
    fileName: { type: DataTypes.STRING, allowNull: false },
    uploadedBy: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "documents", modelName: "StudentDocument", timestamps: true, paranoid: false }
);
