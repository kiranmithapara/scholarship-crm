import { Router } from "express";
import { userController } from "@/controllers/user.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { uploadSingleFile } from "@/middlewares/upload.middleware";
import { updateProfileSchema } from "@/validators/user.validator";

const router = Router();

router.use(authMiddleware);

router.patch("/me", validate(updateProfileSchema), userController.updateProfile);
router.post("/me/photo", uploadSingleFile, userController.uploadPhoto);

export default router;
