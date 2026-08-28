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

export function emailOpensCollection() {
  return getDatabase().collection<EmailOpen>("email_opens");
}
