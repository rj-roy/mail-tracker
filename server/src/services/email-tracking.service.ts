import { ObjectId } from "mongodb";
import { trackedEmailsCollection } from "../models/tracked-email.model.js";
import { emailOpensCollection } from "../models/email-open.model.js";
import { generateTrackingId } from "../utils/tracking-id.js";

export interface RegisterTrackedEmailInput {
  trackingId: string;
  recipient: string;
  subject: string;
}

export interface CreateTrackedEmailInput {
  userId: ObjectId;
  recipient: string;
  subject: string;
}

export interface RecordOpenInput {
  trackingId: string;
  userAgent?: string;
  ipHash?: string;
  referer?: string;
}

export async function createTrackedEmail(
  input: CreateTrackedEmailInput
): Promise<string> {
  const now = new Date();
  const trackingId = generateTrackingId();

  const collection = await trackedEmailsCollection();

  await collection.insertOne({
    userId: input.userId,
    trackingId,
    gmailMessageId: "",
    threadId: "",
    recipient: input.recipient,
    subject: input.subject,
    sentAt: now,
    createdAt: now,
  });

  return trackingId;
}

export async function registerTrackedEmail(
  input: RegisterTrackedEmailInput
): Promise<void> {
  const now = new Date();
  const gmailMessageId = `unknown:${input.trackingId}`;
  const threadId = "";

  const collection = await trackedEmailsCollection();

  const existing = await collection.findOne({
    trackingId: input.trackingId,
  });

  if (existing) {
    return;
  }

  await collection.insertOne({
    userId: new ObjectId(),
    trackingId: input.trackingId,
    gmailMessageId,
    threadId,
    recipient: input.recipient,
    subject: input.subject,
    sentAt: now,
    createdAt: now,
  });
}

export interface TrackedEmailWithOpens {
  trackingId: string;
  recipient: string;
  subject: string;
  sentAt: Date;
  createdAt: Date;
  openCount: number;
  lastOpenedAt: Date | null;
}

export async function getTrackedEmails(
  userId: ObjectId
): Promise<TrackedEmailWithOpens[]> {
  const collection = await trackedEmailsCollection();
  const opens = await emailOpensCollection();

  const emails = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  if (emails.length === 0) {
    return [];
  }

  const trackingIds = emails.map((e) => e.trackingId);

  const openCounts = await opens
    .aggregate([
      { $match: { trackingId: { $in: trackingIds } } },
      {
        $group: {
          _id: "$trackingId",
          count: { $sum: 1 },
          lastOpenedAt: { $max: "$openedAt" },
        },
      },
    ])
    .toArray();

  const openMap = new Map(
    openCounts.map((o) => [o._id, { count: o.count, lastOpenedAt: o.lastOpenedAt }])
  );

  return emails.map((email) => {
    const openData = openMap.get(email.trackingId);
    return {
      trackingId: email.trackingId,
      recipient: email.recipient,
      subject: email.subject,
      sentAt: email.sentAt,
      createdAt: email.createdAt,
      openCount: openData?.count ?? 0,
      lastOpenedAt: openData?.lastOpenedAt ?? null,
    };
  });
}

export async function recordOpen(
  input: RecordOpenInput
): Promise<{ found: boolean }> {
  const collection = await trackedEmailsCollection();

  const tracked = await collection.findOne({
    trackingId: input.trackingId,
  });

  if (!tracked) {
    return { found: false };
  }

  const opens = await emailOpensCollection();
  await opens.insertOne({
    trackingId: input.trackingId,
    openedAt: new Date(),
    userAgent: input.userAgent,
    ipHash: input.ipHash,
    referer: input.referer,
  });

  return { found: true };
}
