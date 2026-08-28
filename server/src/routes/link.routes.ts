import { Router } from "express";
import { serveTrackingLink } from "../controllers/link.controller.js";

const router = Router();

router.get("/l/:trackingId", serveTrackingLink);

export default router;
