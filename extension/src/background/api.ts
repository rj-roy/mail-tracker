import type {
  SendEmailMessage,
  SendEmailResponse,
  TrackEmailMessage,
} from "../shared/messages.js";

const API_BASE_URL = "https://mail-tracker-mu.vercel.app";

export interface AuthStatus {
  signedIn: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

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
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to register tracked email (${response.status})`
    );
  }
}

export async function checkAuth(): Promise<AuthStatus> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return { signedIn: false };
  }

  if (!response.ok) {
    throw new Error(`Auth check failed (${response.status})`);
  }

  const data = (await response.json()) as {
    success: boolean;
    user?: { email?: string; name?: string; picture?: string };
  };

  return {
    signedIn: Boolean(data.success && data.user),
    email: data.user?.email,
    name: data.user?.name,
    picture: data.user?.picture,
  };
}

export async function sendEmail(
  message: SendEmailMessage
): Promise<SendEmailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      recipient: message.recipient,
      subject: message.subject,
      body: message.body,
    }),
  });

  if (response.status === 401) {
    return {
      success: false,
      needsAuth: true,
      error: "You need to sign in to send tracked emails",
    };
  }

  const data = (await response.json().catch(() => null)) as {
    success?: boolean;
    trackingId?: string;
    gmailMessageId?: string;
    message?: string;
  } | null;

  if (!response.ok || !data?.success) {
    return {
      success: false,
      error:
        data?.message ??
        `Failed to send tracked email (${response.status})`,
    };
  }

  return {
    success: true,
    trackingId: data.trackingId,
    gmailMessageId: data.gmailMessageId,
  };
}
