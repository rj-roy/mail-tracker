import { Router } from "express";
import {
  authorize,
  callback,
  success,
  me,
  logout,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/auth/google", authorize);
router.get("/auth/google/callback", callback);
router.get("/auth/success", success);
router.get("/auth/me", me);
router.post("/auth/logout", logout);

export default router;
