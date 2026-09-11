import { Router } from "express";
import { dashboardController } from "@/controllers/dashboard.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { partnerReceiptsFilterSchema } from "@/validators/dashboard.validator";

const router = Router();

router.get("/stats", authMiddleware, dashboardController.getStats);
router.get("/super-admin/stats", authMiddleware, roleMiddleware("super_admin"), dashboardController.getSuperAdminStats);

// V9 NEW: partner-wise receipts with filters
router.get(
  "/partner-receipts",
  authMiddleware,
  roleMiddleware("super_admin"),
  validate(partnerReceiptsFilterSchema),
  dashboardController.getPartnerReceipts
);

export default router;