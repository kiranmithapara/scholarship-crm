import { Router } from "express";
import { dashboardController } from "@/controllers/dashboard.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";

const router = Router();

// General Dashboard stats - role aware (Super Admin gets all, Referral Admin gets their own)
router.get("/stats", authMiddleware, dashboardController.getStats);
router.get("/super-admin/stats", authMiddleware, roleMiddleware("super_admin"), dashboardController.getSuperAdminStats);

export default router;
