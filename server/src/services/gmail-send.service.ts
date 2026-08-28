import { getFreshAccessToken } from "./google-auth.service.js";
import { getAppOrigin, trackingPixelUrl } from "../config/app.js";
import { trackedEmailsCollection } from "../models/tracked-email.model.js";
import type { User } from "../models/user.model.js";

const GMAIL_SEND_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export interface GmailSendInput {
  user: User;
  recipient: string;
  subject: string;
  body: string;
  trackingId: string;
}

interface GmailSendResponse {
  id: string;
  threadId: string;
}

export async function sendTrackedEmail(
  input: GmailSendInput
): Promise<{ gmailMessageId: string; threadId: string }> {
  if (!input.recipient) {
    throw new Error("Recipient is required");
  }

  const rawMessage = buildRawMessage(input);

  const accessToken = await getFreshAccessToken(input.user);

  const response = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | GmailSendResponse
    | { error?: { message?: string } }
    | null;

  if (!response.ok || !data || !("id" in data)) {
    const message =
      data && "error" in data && data.error?.message
        ? data.error.message
        : `Gmail send failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  return {
    gmailMessageId: data.id,
    threadId: data.threadId,
  };
}

export async function updateTrackedEmailResult(
  trackingId: string,
  gmailMessageId: string,
  threadId: string
): Promise<void> {
  const collection = await trackedEmailsCollection();
  await collection.updateOne(
    { trackingId },
    {
      $set: {
        gmailMessageId,
        threadId,
        sentAt: new Date(),
      },
    }
  );
}

function buildRawMessage(input: GmailSendInput): string {
  const pixel = `<img src="${trackingPixelUrl(
    input.trackingId
  )}" width="1" height="1" alt="" style="display:block;width:1px;height:1px" />`;

  const subject = encodeHeader(input.subject || "(no subject)");
  const from = formatAddress(input.user.name, input.user.email);
  const to = input.recipient;

  const textPlain = input.body.trim() || " ";
  const htmlBody = `<html><body><div>${escapeHtml(
    input.body
  )}</div>${pixel}</body></html>`;

  const boundary =
    "mailtracker-boundary-" + Math.random().toString(36).slice(2);

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    textPlain,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    htmlBody,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return Buffer.from(message, "utf8").toString("base64url");
}

function formatAddress(name: string, email: string): string {
  return name ? `${name} <${email}>` : email;
}

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
