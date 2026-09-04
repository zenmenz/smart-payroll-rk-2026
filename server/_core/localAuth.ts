import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const LOCAL_OPEN_ID = process.env.OWNER_OPEN_ID || "local-admin";
const LOCAL_NAME = "Local Admin";
const LOCAL_EMAIL = "admin@localhost";

/**
 * Development-only login that bypasses Manus OAuth so the app can be tested
 * on a local machine without external identity providers.
 */
export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/dev/login", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (!ENV.cookieSecret) {
      res.status(500).json({ error: "JWT_SECRET is not configured" });
      return;
    }

    try {
      await db.upsertUser({
        openId: LOCAL_OPEN_ID,
        name: LOCAL_NAME,
        email: LOCAL_EMAIL,
        loginMethod: "local",
        role: "admin",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(LOCAL_OPEN_ID, {
        name: LOCAL_NAME,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ ok: true, openId: LOCAL_OPEN_ID, name: LOCAL_NAME });
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).json({ error: "Local login failed" });
    }
  });

  app.get("/api/dev/login", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).send("Not found");
      return;
    }

    // Allow browser navigation to log in and land on home.
    try {
      await db.upsertUser({
        openId: LOCAL_OPEN_ID,
        name: LOCAL_NAME,
        email: LOCAL_EMAIL,
        loginMethod: "local",
        role: "admin",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(LOCAL_OPEN_ID, {
        name: LOCAL_NAME,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).send("Local login failed");
    }
  });
}
