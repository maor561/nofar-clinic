import { NextResponse } from "next/server";
import { getCurrentSession } from "@/modules/core/auth/server";
import { savePushSubscription, type BrowserSubscription } from "@/modules/core/push";
import { DbNotConfiguredError } from "@/modules/core/authz";

/** POST { endpoint, keys: { p256dh, auth } } -> stores the subscription for the current user. */
export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let sub: BrowserSubscription;
  try {
    sub = (await req.json()) as BrowserSubscription;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  try {
    await savePushSubscription(
      session.userId,
      sub,
      req.headers.get("user-agent")?.slice(0, 300) ?? null,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DbNotConfiguredError) return NextResponse.json({ ok: false });
    if (e instanceof Error && e.message === "bad_subscription") {
      return NextResponse.json({ error: "bad_subscription" }, { status: 400 });
    }
    throw e;
  }
}
