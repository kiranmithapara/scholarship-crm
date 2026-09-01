import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import partnerRoutes from "./partner.routes";
import studentRoutes from "./student.routes";
import userRoutes from "./user.routes";
import settingsRoutes from "./settings.routes";
import logsRoutes from "./logs.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/referral-partners", partnerRoutes);
router.use("/students", studentRoutes);
router.use("/users", userRoutes);
router.use("/settings", settingsRoutes);
router.use("/logs", logsRoutes);

export default router;
