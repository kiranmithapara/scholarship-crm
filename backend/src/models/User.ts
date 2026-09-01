import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "@/config/database.config";

export type UserRole = "super_admin" | "referral_admin";

/**
 * User model - both Super Admin and Referral Admin.
 * `password` always stores a bcrypt hash - hashing happens in auth.service.ts, NEVER in a
 * beforeSave hook here, so the service layer stays in full control of when hashing occurs
 * (e.g. avoids double-hashing on partial updates).
 */
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare fullName: string;
  declare mobile: string;
  declare email: string;
  declare username: string;
  declare password: string;
  declare role: UserRole;
  declare photoUrl: string | null;
  declare isActive: CreationOptional<boolean>;
  declare isEmailVerified: CreationOptional<boolean>;
  declare lastLoginAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  /** Strips the password hash before sending user objects to the client - use everywhere instead of raw toJSON() */
  toSafeJSON() {
    const { password: _password, ...safe } = this.toJSON();
    return safe;
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fullName: { type: DataTypes.STRING(150), allowNull: false },
    mobile: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("super_admin", "referral_admin"), allowNull: false, defaultValue: "referral_admin" },
    photoUrl: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isEmailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "users", modelName: "User" }
);
