import { Router } from "express";
import { logsController } from "@/controllers/logs.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { listLogsSchema } from "@/validators/logs.validator";

const router = Router();

router.use(authMiddleware, roleMiddleware("super_admin"));

router.get("/login", validate(listLogsSchema), logsController.listLoginLogs);
router.get("/activity", validate(listLogsSchema), logsController.listActivityLogs);

export default router;
