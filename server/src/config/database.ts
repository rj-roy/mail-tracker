import { MongoClient, Db } from "mongodb";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(mongoUri);

let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  await client.connect();

  db = client.db(process.env.MONGODB_DB_NAME || "mail_tracker");

  console.log("MongoDB connected");

  return db;
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database has not been initialized");
  }

  return db;
}
