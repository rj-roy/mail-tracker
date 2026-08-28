export interface TrackEmailMessage {
  type: "TRACK_EMAIL";

  trackingId: string;
  recipient: string;
  subject: string;
}

export type ContentToBackgroundMessage = TrackEmailMessage;

export interface TrackEmailResponse {
  success: boolean;
  error?: string;
}
