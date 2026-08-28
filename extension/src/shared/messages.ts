export interface TrackEmailMessage {
  type: "TRACK_EMAIL";

  trackingId: string;
  recipient: string;
  subject: string;
}

export interface SendEmailMessage {
  type: "SEND_EMAIL";

  recipient: string;
  subject: string;
  body: string;
}

export interface GetTrackedEmailsMessage {
  type: "GET_TRACKED_EMAILS";
}

export type ContentToBackgroundMessage =
  | TrackEmailMessage
  | SendEmailMessage;

export interface TrackEmailResponse {
  success: boolean;
  error?: string;
}

export interface SendEmailResponse {
  success: boolean;
  needsAuth?: boolean;
  trackingId?: string;
  gmailMessageId?: string;
  error?: string;
}

export interface GetAuthStatusMessage {
  type: "GET_AUTH_STATUS";
}

export interface SignInMessage {
  type: "SIGN_IN";
}

export type PopupToBackgroundMessage =
  | GetAuthStatusMessage
  | SignInMessage
  | GetTrackedEmailsMessage;

export interface AuthStatusResponse {
  signedIn: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

export interface TrackedEmailEntry {
  trackingId: string;
  recipient: string;
  subject: string;
  sentAt: string;
  createdAt: string;
  openCount: number;
  lastOpenedAt: string | null;
}

