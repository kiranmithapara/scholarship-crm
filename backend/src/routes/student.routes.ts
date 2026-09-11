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
  documentTypeSchema,
  addPaymentSchema,
  updatePaymentStatusSchema,
  addTimelineStageSchema,
  updateCommissionStatusSchema,
  updateTimelineNoteSchema,
  timelineEntryParamSchema,
  addNoteSchema,
  updateNoteSchema,
  noteParamSchema,
} from "@/validators/student.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(listStudentsSchema), studentController.list);
router.get("/suggestions", studentController.getFieldSuggestions);

// V7 NEW: Deleted students (Super Admin only). MUST be before /:id
router.get("/deleted", validate(listStudentsSchema), studentController.listDeleted);

router.post("/", validate(createStudentSchema), studentController.create);
router.get("/:id", validate(studentIdParamSchema), studentController.getById);
router.patch("/:id", validate(updateStudentSchema), studentController.update);

// V7 NEW: Soft delete (Super Admin only)
router.delete(
  "/:id",
  roleMiddleware("super_admin"),
  validate(studentIdParamSchema),
  studentController.softDelete
);

// V7 NEW: Restore (Super Admin only)
router.post(
  "/:id/restore",
  roleMiddleware("super_admin"),
  validate(studentIdParamSchema),
  studentController.restore
);

// V7 NEW: Permanent delete (Super Admin only)
router.delete(
  "/:id/permanent",
  roleMiddleware("super_admin"),
  validate(studentIdParamSchema),
  studentController.permanentDelete
);

router.patch(
  "/:id/commission/status",
  roleMiddleware("super_admin"),
  validate(updateCommissionStatusSchema),
  studentController.updateCommissionStatus
);

router.post("/:id/timeline-stage", validate(addTimelineStageSchema), studentController.addTimelineStage);

// Timeline note edit/delete (Super Admin only)
router.patch(
  "/:id/timeline/:timelineId",
  roleMiddleware("super_admin"),
  validate(updateTimelineNoteSchema),
  studentController.updateTimelineNote
);
router.delete(
  "/:id/timeline/:timelineId",
  roleMiddleware("super_admin"),
  validate(timelineEntryParamSchema),
  studentController.deleteTimelineEntry
);

// Internal notes (Super Admin only)
router.post(
  "/:id/notes",
  roleMiddleware("super_admin"),
  validate(addNoteSchema),
  studentController.addNote
);
router.patch(
  "/:id/notes/:noteId",
  roleMiddleware("super_admin"),
  validate(updateNoteSchema),
  studentController.updateNote
);
router.delete(
  "/:id/notes/:noteId",
  roleMiddleware("super_admin"),
  validate(noteParamSchema),
  studentController.deleteNote
);

router.get("/:id/activity-logs", validate(studentIdParamSchema), studentController.getActivityLogs);
router.post("/:id/documents", uploadSingleFile, validate(documentTypeSchema), studentController.uploadDocument);
router.post("/:id/payments", validate(addPaymentSchema), studentController.addPayment);
router.patch(
  "/:id/payments/:paymentId/status",
  roleMiddleware("super_admin"),
  validate(updatePaymentStatusSchema),
  studentController.updatePaymentStatus
);

export default router;