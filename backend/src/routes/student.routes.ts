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
} from "@/validators/student.validator";

const router = Router();

router.use(authMiddleware); // every student route requires login; fine-grained scoping happens in the service layer

router.get("/", validate(listStudentsSchema), studentController.list);
router.post("/", validate(createStudentSchema), studentController.create);
router.get("/:id", validate(studentIdParamSchema), studentController.getById);
router.patch("/:id", validate(updateStudentSchema), studentController.update);

// ---------- Super Admin only ----------
router.post("/:id/verify", roleMiddleware("super_admin"), validate(studentIdParamSchema), studentController.verify);
router.post("/:id/request-correction", roleMiddleware("super_admin"), validate(requestCorrectionSchema), studentController.requestCorrection);
router.post("/:id/complete", roleMiddleware("super_admin"), validate(studentIdParamSchema), studentController.markCompleted);
router.patch("/:id/payments/:paymentId/status", roleMiddleware("super_admin"), validate(updatePaymentStatusSchema), studentController.updatePaymentStatus);

// ---------- Shared (ownership-checked inside the service) ----------
// V2 UPGRADE: /scholarship endpoint removed (MYSY fields gone) - replaced by /timeline-stage,
// the new manual 13-stage scholarship-progress tracker.
router.post("/:id/timeline-stage", validate(addTimelineStageSchema), studentController.addTimelineStage);
router.get("/:id/activity-logs", validate(studentIdParamSchema), studentController.getActivityLogs);
// V2 UPGRADE: hostel_receipt upload permission (Super Admin only) is enforced inside
// studentService.addDocument, not here, since it depends on the document `type` in the body.
router.post("/:id/documents", uploadSingleFile, validate(documentTypeSchema), studentController.uploadDocument);
router.post("/:id/payments", validate(addPaymentSchema), studentController.addPayment);

export default router;
