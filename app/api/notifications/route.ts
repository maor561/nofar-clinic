import { NextResponse } from "next/server";
import { myNotifications, myUnreadCount, markMineRead } from "@/modules/core/notifications/server";
import { DbNotConfiguredError } from "@/modules/core/authz";

/** GET -> { count, items }  ·  POST { ids?: string[] } -> mark read, returns { count } */

export async function GET() {
  try {
    const [count, items] = await Promise.all([myUnreadCount(), myNotifications({ limit: 15 })]);
    return NextResponse.json({ count, items }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof DbNotConfiguredError) return NextResponse.json({ count: 0, items: [] });
    throw e;
  }
}

export async function POST(req: Request) {
  let ids: string[] | undefined;
  try {
    const body = (await req.json()) as { ids?: unknown };
    if (Array.isArray(body.ids)) ids = body.ids.filter((x): x is string => typeof x === "string");
  } catch {
    // no body -> mark all
  }
  try {
    await markMineRead(ids);
    return NextResponse.json({ count: await myUnreadCount() });
  } catch (e) {
    if (e instanceof DbNotConfiguredError) return NextResponse.json({ count: 0 });
    throw e;
  }
}
