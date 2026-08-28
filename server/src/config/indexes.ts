import { getDatabase } from "./database.js";

export async function createIndexes() {
  const db = getDatabase();

  await db.collection("tracked_emails").createIndex(
    { trackingId: 1 },
    { unique: true }
  );

  await db.collection("tracked_emails").createIndex({
    userId: 1,
    createdAt: -1,
  });

  await db.collection("email_opens").createIndex({
    trackingId: 1,
    openedAt: -1,
  });

  console.log("Database indexes created");
}
