import { Router } from "express";
import { partnerController } from "@/controllers/partner.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { uploadSingleFile } from "@/middlewares/upload.middleware";
import {
  listPartnersSchema,
  partnerIdParamSchema,
  updatePartnerStatusSchema,
  updatePartnerSchema,
  createPartnerSchema,
  updatePartnerPricingSchema,
} from "@/validators/partner.validator";

const router = Router();

// All referral partner routes are Super Admin only - a Referral Admin never sees other partners.
router.use(authMiddleware, roleMiddleware("super_admin"));

router.get("/", validate(listPartnersSchema), partnerController.list);
router.post("/", uploadSingleFile, validate(createPartnerSchema), partnerController.create);
router.get("/:id", validate(partnerIdParamSchema), partnerController.getProfile);
router.patch("/:id/status", validate(updatePartnerStatusSchema), partnerController.updateStatus);
router.patch("/:id", validate(updatePartnerSchema), partnerController.update);
// V2 NEW: Super Admin sets each partner's Prepaid/Postpaid buying cost
router.patch("/:id/pricing", validate(updatePartnerPricingSchema), partnerController.updatePricing);
router.delete("/:id", validate(partnerIdParamSchema), partnerController.delete);

export default router;
