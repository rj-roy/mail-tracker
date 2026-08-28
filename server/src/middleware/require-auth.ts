import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!res.locals.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  next();
}
