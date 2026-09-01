import { NextResponse } from "next/server";
import { getCurrentSession } from "@/modules/core/auth/server";
import { deletePushSubscription } from "@/modules/core/push";
import { DbNotConfiguredError } from "@/modules/core/authz";

/** POST { endpoint } -> removes that subscription. */
export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let endpoint: string | undefined;
  try {
    const body = (await req.json()) as { endpoint?: unknown };
    if (typeof body.endpoint === "string") endpoint = body.endpoint;
  } catch {
    /* fall through */
  }
  if (!endpoint) return NextResponse.json({ error: "no_endpoint" }, { status: 400 });

  try {
    await deletePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DbNotConfiguredError) return NextResponse.json({ ok: false });
    throw e;
  }
}
