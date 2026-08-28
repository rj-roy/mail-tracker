import { getDatabase } from "./database.js";

let indexPromise: Promise<void> | null = null;

export async function createIndexes() {
  if (!indexPromise) {
    indexPromise = createIndexesNow().catch((error: unknown) => {
      indexPromise = null;
      throw error;
    });
  }

  return indexPromise;
}

async function createIndexesNow() {
  const db = await getDatabase();

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
