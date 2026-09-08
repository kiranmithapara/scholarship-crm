import { Router } from "express";
import { studentController } from "@/controllers/student.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { uploadSingleFile } from "@/middlewares/upload.middleware";
import {
  createStudentSchema,
  listStudentsSchema,
  studentIdParamSchema,
  updateStudentSchema,
  requestCorrectionSchema,
  documentTypeSchema,
  addPaymentSchema,
  updatePaymentStatusSchema,
  addTimelineStageSchema,
  updateCommissionStatusSchema, // <-- add import
} from "@/validators/student.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(listStudentsSchema), studentController.list);
router.post("/", validate(createStudentSchema), studentController.create);
router.get("/:id", validate(studentIdParamSchema), studentController.getById);
router.patch("/:id", validate(updateStudentSchema), studentController.update);

// ---------- Super Admin only ----------
router.post("/:id/verify", roleMiddleware("super_admin"), validate(studentIdParamSchema), studentController.verify);
router.post("/:id/request-correction", roleMiddleware("super_admin"), validate(requestCorrectionSchema), studentController.requestCorrection);
router.post("/:id/complete", roleMiddleware("super_admin"), validate(studentIdParamSchema), studentController.markCompleted);
router.patch("/:id/payments/:paymentId/status", roleMiddleware("super_admin"), validate(updatePaymentStatusSchema), studentController.updatePaymentStatus);

// V3 NEW: Toggle commission status for this student (Super Admin only).
router.patch(
  "/:id/commission/status",
  roleMiddleware("super_admin"),
  validate(updateCommissionStatusSchema),
  studentController.updateCommissionStatus
);

// ---------- Shared (ownership-checked inside the service) ----------
router.post("/:id/timeline-stage", validate(addTimelineStageSchema), studentController.addTimelineStage);
router.get("/:id/activity-logs", validate(studentIdParamSchema), studentController.getActivityLogs);
router.post("/:id/documents", uploadSingleFile, validate(documentTypeSchema), studentController.uploadDocument);
router.post("/:id/payments", validate(addPaymentSchema), studentController.addPayment);

export default router;