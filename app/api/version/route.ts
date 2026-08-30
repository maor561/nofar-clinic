import { NextResponse } from "next/server";
import { buildInfo } from "@/lib/build-info";

/**
 * GET /api/version — which commit is live right now.
 * Compare `sha` to the latest commit on `main` to confirm the deploy went through.
 */
export function GET() {
  return NextResponse.json(
    {
      ...buildInfo,
      serverTime: new Date().toISOString(),
      env: process.env.VERCEL_ENV ?? "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
