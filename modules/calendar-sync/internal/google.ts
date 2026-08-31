/**
 * Minimal hand-rolled Google Calendar REST client (WP-32) — OAuth token flow,
 * events insert/patch/delete, and free/busy. No googleapis dependency.
 * Every function throws on a non-OK response; callers treat sync as best-effort.
 */
import { CLINIC_TZ } from "@/lib/tz";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_URL = "https://www.googleapis.com/calendar/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
].join(" ");

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

export function redirectUri(): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/integrations/google/callback`;
}

export function authUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      ...body,
    }).toString(),
  });
  if (!res.ok) throw new Error(`google token ${res.status}: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

/** Authorization-code exchange — the response carries the refresh token. */
export function exchangeCode(code: string): Promise<TokenResponse> {
  return tokenRequest({ code, redirect_uri: redirectUri(), grant_type: "authorization_code" });
}

/** Trade a stored refresh token for a short-lived access token. */
export async function accessTokenFrom(refreshToken: string): Promise<string> {
  const t = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
  return t.access_token;
}

export type CalEvent = {
  summary: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
};

function eventBody(ev: CalEvent) {
  return {
    summary: ev.summary,
    description: ev.description,
    start: { dateTime: ev.startsAt.toISOString(), timeZone: CLINIC_TZ },
    end: { dateTime: ev.endsAt.toISOString(), timeZone: CLINIC_TZ },
  };
}

async function calFetch(
  accessToken: string,
  path: string,
  init: RequestInit & { okStatuses?: number[] } = {},
): Promise<Response> {
  const { okStatuses, ...rest } = init;
  const res = await fetch(`${CAL_URL}${path}`, {
    ...rest,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok && !(okStatuses ?? []).includes(res.status)) {
    throw new Error(`google calendar ${res.status}: ${await res.text()}`);
  }
  return res;
}

export async function insertEvent(
  accessToken: string,
  calendarId: string,
  ev: CalEvent,
): Promise<string> {
  const res = await calFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify(eventBody(ev)),
  });
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function patchEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  ev: CalEvent,
): Promise<void> {
  await calFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "PATCH", body: JSON.stringify(eventBody(ev)), okStatuses: [404, 410] },
  );
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  // 404 / 410 → already gone, that's fine
  await calFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE", okStatuses: [404, 410] },
  );
}

export async function freeBusy(
  accessToken: string,
  calendarId: string,
  from: Date,
  to: Date,
): Promise<{ start: Date; end: Date }[]> {
  const res = await calFetch(accessToken, `/freeBusy`, {
    method: "POST",
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  const json = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  };
  const busy = json.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}
