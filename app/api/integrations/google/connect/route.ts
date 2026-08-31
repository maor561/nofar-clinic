import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireTherapist } from "@/modules/core/auth/server";
import { buildAuthUrl, googleConfigured } from "@/modules/calendar-sync";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

/** Kick off the Google OAuth flow (therapist only). */
export async function GET() {
  await requireTherapist();

  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/t/settings?google=unconfigured", BASE));
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
