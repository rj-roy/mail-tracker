import { Router } from "express";
import {
  createTrackedEmail,
  listTrackedEmails,
} from "../controllers/tracked-email.controller.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.get("/tracked-emails", requireAuth, listTrackedEmails);
router.post("/tracked-emails", createTrackedEmail);

export default router;
