import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/modules/core/push";

/** GET -> { key } : the VAPID public key the browser needs to subscribe. */
export function GET() {
  return NextResponse.json({ key: vapidPublicKey() }, { headers: { "cache-control": "no-store" } });
}
