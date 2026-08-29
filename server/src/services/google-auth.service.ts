import {
  getGoogleOAuthConfig,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  GOOGLE_SCOPES,
  isGoogleConfigured,
} from "../config/google-oauth.js";
import { encryptSecret, decryptSecret } from "../utils/encryption.js";
import { usersCollection } from "../models/user.model.js";
import type { User } from "../models/user.model.js";

export interface AccessTokenPayload {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface StoredUser extends User {}

export function assertGoogleConfigured(): void {
  if (!isGoogleConfigured()) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI."
    );
  }
}

export function buildAuthorizeUrl(state: string): string {
  assertGoogleConfigured();

  const cfg = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<AccessTokenPayload> {
  assertGoogleConfigured();

  const cfg = getGoogleOAuthConfig();

  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await response.json()) as AccessTokenPayload;

  if (!response.ok || !data.access_token) {
    throw new Error("Google token exchange failed");
  }

  return data;
}

export async function fetchGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL!, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const data = (await response.json()) as GoogleUserInfo;

  if (!data.id || !data.email) {
    throw new Error("Google user info missing id/email");
  }

  return data;
}

export async function upsertUser(
  info: GoogleUserInfo,
  tokens: AccessTokenPayload
): Promise<StoredUser> {
  const now = new Date();
  const expiresAt = tokens.expires_in
    ? new Date(now.getTime() + tokens.expires_in * 1000)
    : undefined;

  const collection = await usersCollection();

  const existing = await collection.findOne({
    googleId: info.id,
  });

  const fields = {
    email: info.email,
    name: info.name ?? info.email,
    picture: info.picture,
    encryptedAccessToken: encryptSecret(tokens.access_token),
    encryptedRefreshToken: tokens.refresh_token
      ? encryptSecret(tokens.refresh_token)
      : undefined,
    tokenExpiresAt: expiresAt,
    updatedAt: now,
  };

  if (existing) {
    await collection.updateOne(
      { googleId: info.id },
      { $set: fields }
    );

    const updated = await collection.findOne({ googleId: info.id });
    if (!updated) {
      throw new Error("Failed to load updated user");
    }
    return updated;
  }

  const result = await collection.insertOne({
    googleId: info.id,
    email: info.email,
    name: info.name ?? info.email,
    picture: info.picture,
    encryptedAccessToken: encryptSecret(tokens.access_token),
    encryptedRefreshToken: tokens.refresh_token
      ? encryptSecret(tokens.refresh_token)
      : undefined,
    tokenExpiresAt: expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  const created = await collection.findOne({ _id: result.insertedId });
  if (!created) {
    throw new Error("Failed to load created user");
  }
  return created;
}

export async function findUserByGoogleId(
  googleId: string
): Promise<StoredUser | null> {
  const collection = await usersCollection();
  return collection.findOne({ googleId });
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  assertGoogleConfigured();

  const cfg = getGoogleOAuthConfig();

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await response.json()) as AccessTokenPayload;

  if (!response.ok || !data.access_token) {
    throw new Error("Google token refresh failed");
  }

  const now = new Date();
  const expiresAt = data.expires_in
    ? new Date(now.getTime() + data.expires_in * 1000)
    : new Date(now.getTime() + 3600 * 1000);

  return { accessToken: data.access_token, expiresAt };
}

export async function getFreshAccessToken(
  user: User
): Promise<string> {
  if (!user.tokenExpiresAt || user.tokenExpiresAt.getTime() > Date.now() + 60_000) {
    return decryptSecret(user.encryptedAccessToken);
  }

  if (!user.encryptedRefreshToken) {
    throw new Error("No refresh token available");
  }

  const refreshToken = decryptSecret(user.encryptedRefreshToken);
  const { accessToken, expiresAt } = await refreshAccessToken(refreshToken);

  const collection = await usersCollection();
  await collection.updateOne(
    { _id: user._id },
    {
      $set: {
        encryptedAccessToken: encryptSecret(accessToken),
        tokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    }
  );

  return accessToken;
}
