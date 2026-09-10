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
  updateCommissionStatusSchema,
  addPartnerNoteSchema,
  updatePartnerNoteSchema,
  partnerNoteParamSchema,
} from "@/validators/partner.validator";

const router = Router();

router.use(authMiddleware, roleMiddleware("super_admin"));

router.get("/", validate(listPartnersSchema), partnerController.list);
router.post("/", uploadSingleFile, validate(createPartnerSchema), partnerController.create);
router.get("/:id", validate(partnerIdParamSchema), partnerController.getProfile);
router.patch("/:id/status", validate(updatePartnerStatusSchema), partnerController.updateStatus);
router.patch("/:id", validate(updatePartnerSchema), partnerController.update);
router.patch("/:id/pricing", validate(updatePartnerPricingSchema), partnerController.updatePricing);
router.get("/:id/commissions", validate(partnerIdParamSchema), partnerController.getCommissions);
router.patch("/:id/commissions/:commissionId/status", validate(updateCommissionStatusSchema), partnerController.updateCommissionStatus);
// V4 NEW: bulk mark all pending commissions as paid
router.patch("/:id/commissions/mark-all-paid", validate(partnerIdParamSchema), partnerController.markAllCommissionsPaid);
router.delete("/:id", validate(partnerIdParamSchema), partnerController.delete);


// V6 NEW: Partner Notes
router.post(
  "/:id/notes",
  validate(addPartnerNoteSchema),
  partnerController.addNote
);
router.patch(
  "/:id/notes/:noteId",
  validate(updatePartnerNoteSchema),
  partnerController.updateNote
);
router.delete(
  "/:id/notes/:noteId",
  validate(partnerNoteParamSchema),
  partnerController.deleteNote
);

export default router;