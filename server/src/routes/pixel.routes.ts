import { Router } from "express";
import { serveTrackingPixel } from "../controllers/pixel.controller.js";

const router = Router();

router.get("/t/:trackingId.gif", serveTrackingPixel);

export default router;
