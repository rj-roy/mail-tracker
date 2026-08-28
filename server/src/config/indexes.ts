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

  await db.collection(process.env.USER_COLLECTION!).createIndex(
    { googleId: 1 },
    { unique: true }
  );

  await db.collection(process.env.TRACKED_EMAILS_COLL!).createIndex(
    { trackingId: 1 },
    { unique: true }
  );

  await db.collection(process.env.TRACKED_EMAILS_COLL!).createIndex({
    userId: 1,
    createdAt: -1,
  });

  await db.collection(process.env.OPEN_EMAIL_COLL!).createIndex({
    trackingId: 1,
    openedAt: -1,
  });

  console.log("Database indexes created");
}
