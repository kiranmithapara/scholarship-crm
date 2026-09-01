import { User } from "./User";
import { Otp } from "./Otp";
import { Student } from "./Student";
import { StudentDocument } from "./Document";
import { Payment } from "./Payment";
import { StudentTimeline } from "./StudentTimeline";
import { Commission } from "./Commission";
import { LoginLog } from "./LoginLog";
import { ActivityLog } from "./ActivityLog";
import { Setting } from "./Setting";

/**
 * ASSOCIATIONS - defined centrally here (not inside individual model files) so the full
 * relationship graph is visible in one place. Every association below matches DATABASE.md.
 */

// ---- User (Referral Admin) <-> Student ----
User.hasMany(Student, { foreignKey: "referralPartnerId", as: "students" });
Student.belongsTo(User, { foreignKey: "referralPartnerId", as: "referralPartner" });

// ---- Student <-> Documents ----
Student.hasMany(StudentDocument, { foreignKey: "studentId", as: "documents" });
StudentDocument.belongsTo(Student, { foreignKey: "studentId", as: "student" });
User.hasMany(StudentDocument, { foreignKey: "uploadedBy", as: "uploadedDocuments" });
StudentDocument.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader" });

// ---- Student <-> Payments ----
Student.hasMany(Payment, { foreignKey: "studentId", as: "payments" });
Payment.belongsTo(Student, { foreignKey: "studentId", as: "student" });

// ---- Student <-> Timeline ----
Student.hasMany(StudentTimeline, { foreignKey: "studentId", as: "timeline" });
StudentTimeline.belongsTo(Student, { foreignKey: "studentId", as: "student" });
User.hasMany(StudentTimeline, { foreignKey: "createdBy", as: "timelineEntries" });
StudentTimeline.belongsTo(User, { foreignKey: "createdBy", as: "actor" });

// ---- Commission: belongs to both a Referral Partner (User) and a Student ----
User.hasMany(Commission, { foreignKey: "referralPartnerId", as: "commissions" });
Commission.belongsTo(User, { foreignKey: "referralPartnerId", as: "referralPartner" });
Student.hasOne(Commission, { foreignKey: "studentId", as: "commission" });
Commission.belongsTo(Student, { foreignKey: "studentId", as: "student" });

// ---- Logs ----
User.hasMany(LoginLog, { foreignKey: "userId", as: "loginLogs" });
LoginLog.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(ActivityLog, { foreignKey: "userId", as: "activityLogs" });
ActivityLog.belongsTo(User, { foreignKey: "userId", as: "user" });

export { User, Otp, Student, StudentDocument, Payment, StudentTimeline, Commission, LoginLog, ActivityLog, Setting };
