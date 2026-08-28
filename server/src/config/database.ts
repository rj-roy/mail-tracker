import { MongoClient, Db } from "mongodb";

const mongoUri = process.env.MONGODB_URI ?
  new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  : null;

let dbPromise: Promise<Db> | null = null;

function getDbName(): string {
  return process.env.MONGODB_DB_NAME!;
}

export function connectDatabase(): Promise<Db> {
  if (!mongoUri) {
    return Promise.reject(
      new Error("MONGODB_URI is not defined")
    );
  }

  if (!dbPromise) {
    dbPromise = mongoUri.connect().then(() => {
      console.log("MongoDB connected");
      return mongoUri!.db(getDbName());
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
