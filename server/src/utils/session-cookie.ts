import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "../config/google-oauth.js";

const COOKIE_NAME = process.env.RAW_COOKIE_NAME!;

const sign = (value: string) => {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64');
};

export function createSessionCookieValue(googleId: string): string {
  const payload = Buffer.from(googleId, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionCookieValue(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  };

  const [payload, signature] = raw.split(".");
  console.log(payload?.length, signature?.length, 'lolollol');

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  console.log(signatureBuffer.length, expectedBuffer.length, 'llll');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  return Buffer.from(payload, "base64url").toString("utf8");
}

export { COOKIE_NAME };
