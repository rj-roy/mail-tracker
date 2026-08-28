import type { Request, Response } from "express";
import { recordOpen } from "../services/email-tracking.service.js";
import { hashValue } from "../utils/hash.js";

function headerString(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export async function serveTrackingLink(
  req: Request,
  res: Response
): Promise<void> {
  const rawTrackingId = req.params.trackingId;

  const trackingId = Array.isArray(rawTrackingId)
    ? rawTrackingId[0]
    : rawTrackingId;

  if (!trackingId) {
    res.status(400).end();
    return;
  }

  const ipHash = req.ip ? hashValue(req.ip) : undefined;

  const result = await recordOpen({
    trackingId,
    userAgent: headerString(req.headers["user-agent"]),
    ipHash,
    referer: req.get("referer") ?? undefined,
  });

  if (!result.found) {
    res.status(404).end();
    return;
  }

  res.redirect(302, "https://example.com");
}
