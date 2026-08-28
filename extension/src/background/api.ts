import type { TrackEmailMessage } from "../shared/messages.js";

const API_BASE_URL = "http://localhost:5000";

export interface CreateTrackedEmailRequest {
  trackingId: string;
  recipient: string;
  subject: string;
}

export async function registerTrackedEmail(
  message: TrackEmailMessage
): Promise<void> {
  const body: CreateTrackedEmailRequest = {
    trackingId: message.trackingId,
    recipient: message.recipient,
    subject: message.subject,
  };

  const response = await fetch(`${API_BASE_URL}/api/tracked-emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to register tracked email (${response.status})`
    );
  }
}
