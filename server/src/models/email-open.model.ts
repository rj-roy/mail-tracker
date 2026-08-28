import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database.js";

export interface EmailOpen {
  _id?: ObjectId;

  trackingId: string;

  openedAt: Date;

  userAgent?: string;

  ipHash?: string;

  referer?: string;
}

export async function emailOpensCollection() {
  const db = await getDatabase();
  return db.collection<EmailOpen>("email_opens");
}
