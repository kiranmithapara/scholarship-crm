import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type ForeignKey } from "sequelize";
import { sequelize } from "@/config/database.config";
import { Student } from "./Student";
import { User } from "./User";

/**
 * V5 NEW: StudentNote model - Super Admin's free-form internal notes per student.
 * Never exposed to Referral Partners (enforced at service layer).
 */
export class StudentNote extends Model<InferAttributes<StudentNote>, InferCreationAttributes<StudentNote>> {
  declare id: CreationOptional<string>;
  declare studentId: ForeignKey<Student["id"]>;
  declare note: string;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

StudentNote.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: false },
    createdBy: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "student_notes", modelName: "StudentNote", timestamps: true, paranoid: false }
);

export default StudentNote;