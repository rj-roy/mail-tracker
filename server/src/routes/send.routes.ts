import { Router } from "express";
import { sendTrackedEmailHandler } from "../controllers/send.controller.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.post("/send", requireAuth, sendTrackedEmailHandler);

export default router;
