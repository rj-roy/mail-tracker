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
  | SignInMessage;

export interface AuthStatusResponse {
  signedIn: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

