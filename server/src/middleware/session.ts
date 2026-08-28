import type { NextFunction, Request, Response } from "express";
import {
  COOKIE_NAME,
  readSessionCookieValue,
} from "../utils/session-cookie.js";
import { findUserByGoogleId } from "../services/google-auth.service.js";
import type { User } from "../models/user.model.js";

declare global {
  namespace Express {
    interface Locals {
      user?: User;
      googleId?: string;
    }
  }
}

export async function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawCookie = parseCookieHeader(
      req.headers.cookie,
      COOKIE_NAME
    );

    if (rawCookie) {
      const googleId = readSessionCookieValue(rawCookie);

      if (googleId) {
        const user = await findUserByGoogleId(googleId);
        res.locals.googleId = googleId;
        res.locals.user = user ?? undefined;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

function parseCookieHeader(
  header: string | undefined,
  name: string
): string | undefined {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=");
    }
  }

  return undefined;
}
