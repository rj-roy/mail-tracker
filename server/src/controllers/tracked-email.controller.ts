import type { Request, Response } from "express";
import {
  registerTrackedEmail,
} from "../services/email-tracking.service.js";

export async function createTrackedEmail(
  req: Request,
  res: Response
): Promise<void> {
  const { trackingId, recipient, subject } = req.body ?? {};

  if (
    typeof trackingId !== "string" ||
    !trackingId ||
    typeof recipient !== "string" ||
    !recipient
  ) {
    res.status(400).json({
      success: false,
      message: "trackingId and recipient are required",
    });
    return;
  }

  await registerTrackedEmail({
    trackingId,
    recipient,
    subject: typeof subject === "string" ? subject : "",
  });

  res.status(201).json({
    success: true,
    trackingId,
  });
}
