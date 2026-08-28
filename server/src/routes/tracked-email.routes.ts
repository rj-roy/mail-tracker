import { Router } from "express";
import { createTrackedEmail } from "../controllers/tracked-email.controller.js";

const router = Router();

router.post("/tracked-emails", createTrackedEmail);

export default router;
