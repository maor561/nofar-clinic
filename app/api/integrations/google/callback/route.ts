import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireTherapist } from "@/modules/core/auth/server";
import { completeConnection } from "@/modules/calendar-sync";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

/** Google redirects here with `code` + `state`. */
export async function GET(req: Request) {
  const session = await requireTherapist();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const back = (status: string) =>
    NextResponse.redirect(new URL(`/t/settings?google=${status}`, BASE));

  if (oauthError) return back("denied");

  const jar = await cookies();
  const expected = jar.get("g_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) return back("state");

  try {
    await completeConnection(session.therapistId, code);
  } catch {
    return back("error");
  }

  const res = back("connected");
  res.cookies.delete("g_oauth_state");
  return res;
}
