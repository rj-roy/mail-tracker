import type { Request, Response } from "express";
import { createTrackedEmail } from "../services/email-tracking.service.js";
import {
  sendTrackedEmail,
  updateTrackedEmailResult,
} from "../services/gmail-send.service.js";

export async function sendTrackedEmailHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = res.locals.user;

    if (!user || !user._id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { recipient, subject, body } = req.body ?? {};

    if (
      typeof recipient !== "string" ||
      !recipient ||
      typeof subject !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "recipient and subject are required",
      });
      return;
    }

    const trackingId = await createTrackedEmail({
      userId: user._id,
      recipient,
      subject,
    });

    const result = await sendTrackedEmail({
      user,
      recipient,
      subject,
      body: typeof body === "string" ? body : "",
      trackingId,
    });

    await updateTrackedEmailResult(
      trackingId,
      result.gmailMessageId,
      result.threadId
    );

    res.status(201).json({
      success: true,
      trackingId,
      gmailMessageId: result.gmailMessageId,
      threadId: result.threadId,
    });
  } catch (error) {
    console.error("[send] Error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
