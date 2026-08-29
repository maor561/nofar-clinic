import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DbNotConfiguredError } from "@/modules/core/data/client";
import {
  SESSION_COOKIE,
  readSession,
  revokeSession,
  getDisplayName,
  type ActiveSession,
} from "./index";

export { getDisplayName };

/**
 * The Next-only surface of core/auth: bridges the pure service to the request
 * (cookies / headers) and to redirects. Route handlers, layouts and server
 * actions use these — the scoping guard (WP-03) will wrap `getCurrentSession`.
 */

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function writeSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, { ...cookieOpts, expires: expiresAt });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });
}

export async function requestContext(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return {
    ip: fwd ? fwd.split(",")[0]!.trim() : (h.get("x-real-ip") ?? null),
    userAgent: h.get("user-agent"),
  };
}

/**
 * Resolve the current session from the cookie. Rotates the cookie if the session
 * was stale. Returns null when there is no valid session — or when no DB is
 * configured (deployed preview before WP-04), so callers just treat it as
 * "logged out" rather than crashing.
 */
export async function getCurrentSession(): Promise<ActiveSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const result = await readSession(token);
    if (!result) return null;
    if (result.renewedToken) {
      jar.set(SESSION_COOKIE, result.renewedToken, {
        ...cookieOpts,
        expires: result.active.expiresAt,
      });
    }
    return result.active;
  } catch (e) {
    if (e instanceof DbNotConfiguredError) return null;
    throw e;
  }
}

export async function requireTherapist(): Promise<ActiveSession> {
  const s = await getCurrentSession();
  if (!s || s.role !== "therapist") redirect("/login");
  return s;
}

export async function requirePatient(): Promise<ActiveSession> {
  const s = await getCurrentSession();
  if (!s || s.role !== "patient") redirect("/login");
  return s;
}

export async function logout(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await revokeSession(token);
    } catch (e) {
      if (!(e instanceof DbNotConfiguredError)) throw e;
    }
  }
  await clearSessionCookie();
}
