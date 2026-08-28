import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database.js";

export interface TrackedEmail {
  _id?: ObjectId;
  userId: ObjectId;

  trackingId: string;

  gmailMessageId: string;
  threadId: string;

  recipient: string;
  subject: string;

  sentAt: Date;
  createdAt: Date;
}

export function trackedEmailsCollection() {
  return getDatabase().collection<TrackedEmail>("tracked_emails");
}
