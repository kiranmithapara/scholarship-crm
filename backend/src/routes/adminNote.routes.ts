import { Router } from "express";
import { adminNoteController } from "@/controllers/adminNote.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import {
  createAdminNoteSchema,
  updateAdminNoteSchema,
  adminNoteParamSchema,
} from "@/validators/adminNote.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", adminNoteController.list);
router.post("/", validate(createAdminNoteSchema), adminNoteController.create);
router.patch("/:noteId", validate(updateAdminNoteSchema), adminNoteController.update);
router.delete("/:noteId", validate(adminNoteParamSchema), adminNoteController.delete);

export default router;