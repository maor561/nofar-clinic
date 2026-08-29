import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "nofar_session";

/**
 * Coarse gate only: bounce anonymous requests off the app areas before they
 * render. The real check (valid session, correct role) happens server-side in
 * the route-group layouts via requireTherapist / requirePatient, and — from
 * WP-03 — the scoping guard. Middleware runs on the edge and never touches the DB.
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const { pathname } = req.nextUrl;

  const isAppArea =
    pathname === "/t" ||
    pathname.startsWith("/t/") ||
    pathname === "/p" ||
    pathname.startsWith("/p/");

  if (isAppArea && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/t", "/t/:path*", "/p", "/p/:path*"],
};
