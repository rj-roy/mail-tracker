import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  upsertUser,
} from "../services/google-auth.service.js";
import {
  createSessionCookieValue,
  COOKIE_NAME,
} from "../utils/session-cookie.js";
import { getAppOrigin } from "../config/app.js";

const STATE_COOKIE = "mail_tracker_oauth_state";

function setSessionCookie(
  res: Response,
  googleId: string
): void {
  res.cookie(
    COOKIE_NAME,
    createSessionCookieValue(googleId),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: getAppOrigin().startsWith("https://"),
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    }
  );
}

export async function authorize(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const state = randomBytes(16).toString("hex");

    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: getAppOrigin().startsWith("https://"),
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    res.redirect(buildAuthorizeUrl(state));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "OAuth error",
    });
  }
}

export async function callback(
  req: Request,
  res: Response
): Promise<void> {
  const { code, state } = req.query;
  const expectedState = parseCookieHeader(
    req.headers.cookie,
    STATE_COOKIE
  );

  try {
    if (!code || typeof code !== "string") {
      res.status(400).send("Missing authorization code");
      return;
    }

    if (!state || !expectedState || state !== expectedState) {
      res.status(400).send("Invalid OAuth state");
      return;
    }

    const tokens = await exchangeCodeForTokens(code);
    const info = await fetchGoogleUserInfo(tokens.access_token);

    await upsertUser(info, tokens);

    setSessionCookie(res, info.id);

    res.clearCookie(STATE_COOKIE, { path: "/" });

    res.redirect(`${getAppOrigin()}/auth/success`);
  } catch (error) {
    console.error("OAuth callback failed:", error);
    res.status(500).json({
      success: false,
      message: "OAuth callback failed",
    });
  }
}

export function success(
  _req: Request,
  res: Response
): void {
  res
    .set("Content-Type", "text/html; charset=utf-8")
    .send(
      "<html><body style='font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><div><h2>Signed in to Mail Tracker</h2><p>You can close this tab and use the extension.</p></div></body></html>"
    );
}

export function me(
  _req: Request,
  res: Response
): void {
  const user = res.locals.user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: "Not signed in",
    });
    return;
  }

  res.json({
    success: true,
    user: {
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  });
}

export function logout(
  req: Request,
  res: Response
): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
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
