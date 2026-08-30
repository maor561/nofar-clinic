import { afterEach, describe, expect, it, vi } from "vitest";
import {
  inviteEmail,
  passwordResetEmail,
  upcomingAppointmentEmail,
  planChangedEmail,
} from "./internal/templates";
import { sendEmail } from "./internal/client";
import { appUrl, sendInviteEmail, sendPasswordResetEmail } from "./index";

afterEach(() => vi.unstubAllEnvs());

describe("templates", () => {
  it("all four render RTL Hebrew with their data", () => {
    const t1 = inviteEmail({ inviteUrl: "https://x/invite/abc", patientName: "מיכל" });
    const t2 = passwordResetEmail({ resetUrl: "https://x/reset/tok" });
    const t3 = upcomingAppointmentEmail({ when: "17 בספטמבר 10:30", treatmentType: "נטורופתיה" });
    const t4 = planChangedEmail({ planUrl: "https://x/p/plan", versionNote: "פרוטוקול שינה" });

    for (const t of [t1, t2, t3, t4]) {
      expect(t.subject.length).toBeGreaterThan(3);
      expect(t.text.length).toBeGreaterThan(10);
      expect(t.html).toContain('dir="rtl"');
      expect(t.html).toContain('lang="he"');
    }
    expect(t1.html).toContain("https://x/invite/abc");
    expect(t1.html).toContain("מיכל");
    expect(t2.html).toContain("https://x/reset/tok");
    expect(t3.subject).toContain("17 בספטמבר");
    expect(t4.html).toContain("פרוטוקול שינה");
  });
});

describe("sendEmail — fail-open", () => {
  it("skips (no throw) when RESEND_API_KEY is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const r = await sendEmail({ to: "a@b.co", subject: "s", html: "<p>h</p>", text: "t" });
    expect(r).toEqual({ ok: false, skipped: true });
  });
});

describe("url building", () => {
  it("uses APP_URL for links", async () => {
    vi.stubEnv("APP_URL", "https://nofar-clinic.vercel.app");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(appUrl("/reset/x")).toBe("https://nofar-clinic.vercel.app/reset/x");
    // send functions still resolve to skipped without a key
    expect(await sendInviteEmail("p@ex.co", { token: "tok" })).toMatchObject({ skipped: true });
    expect(await sendPasswordResetEmail("p@ex.co", { token: "tok" })).toMatchObject({
      skipped: true,
    });
  });
});
