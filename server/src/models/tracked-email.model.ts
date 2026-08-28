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

export async function trackedEmailsCollection() {
  const db = await getDatabase();
  return db.collection<TrackedEmail>("tracked_emails");
}
