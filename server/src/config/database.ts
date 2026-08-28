import { MongoClient, Db } from "mongodb";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 5000,
});

let dbPromise: Promise<Db> | null = null;

function getDbName(): string {
  return process.env.MONGODB_DB_NAME || "mail_tracker";
}

export function connectDatabase(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = client
      .connect()
      .then(() => {
        console.log("MongoDB connected");
        return client.db(getDbName());
      })
      .catch((error: unknown) => {
        dbPromise = null;
        throw error;
      });
  }

  return dbPromise;
}

export async function getDatabase(): Promise<Db> {
  return connectDatabase();
}
