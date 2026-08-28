import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database.js";

export interface User {
  _id?: ObjectId;

  googleId: string;
  email: string;
  name: string;
  picture?: string;

  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  tokenExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export async function usersCollection() {
  const db = await getDatabase();
  return db.collection<User>("users");
}
