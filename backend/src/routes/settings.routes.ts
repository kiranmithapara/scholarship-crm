import { Router } from "express";
import { settingsController } from "@/controllers/settings.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { uploadSingleFile } from "@/middlewares/upload.middleware";
import { updateSettingsSchema } from "@/validators/settings.validator";

const router = Router();

// Settings are Super Admin only, end to end - a Referral Admin has no reason to ever hit this router.
router.use(authMiddleware, roleMiddleware("super_admin"));

router.get("/", settingsController.get);
router.patch("/", validate(updateSettingsSchema), settingsController.update);
router.post("/logo", uploadSingleFile, settingsController.uploadLogo);

export default router;
