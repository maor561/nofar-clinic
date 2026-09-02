import type { Metadata } from "next";
import Link from "next/link";
import { requireTherapist, getDisplayName } from "@/modules/core/auth/server";
import { getAccountInfo } from "@/modules/core/auth";
import { getConnectionStatus } from "@/modules/calendar-sync";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
} from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";
import { PushToggle } from "@/modules/core/push/push-toggle";
import { ChangePasswordForm, TotpEnroll } from "./settings-forms";
import { disconnectGoogleAction } from "./actions";

export const metadata: Metadata = { title: "הגדרות" };

const SOON = ["פרטי הקליניקה והמיתוג", "מדיניות שמירת מידע ונספח רגולציה"];
const dateFmt = clinicDateFmt({ dateStyle: "medium" });

const GOOGLE_BANNER: Record<string, { text: string; ok?: boolean }> = {
  connected: { text: "יומן Google חובר בהצלחה.", ok: true },
  denied: { text: "החיבור בוטל אצל Google." },
  state: { text: "החיבור נכשל (בקשה לא תקינה). נסו שוב." },
  error: { text: "החיבור נכשל. ודאו שאישרתם את כל ההרשאות ונסו שוב." },
  unconfigured: { text: "החיבור ל-Google עדיין לא הוגדר בשרת." },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const session = await requireTherapist();
  const [name, acc, gcal, sp] = await Promise.all([
    getDisplayName(session),
    getAccountInfo(session.userId),
    getConnectionStatus(session.therapistId),
    searchParams,
  ]);
  const banner = sp.google ? GOOGLE_BANNER[sp.google] : undefined;

  return (
    <div className="max-w-2xl space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">הגדרות</h1>
        <p className="text-ink-soft text-sm">חשבון ואבטחה.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>חשבון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row label="שם" value={name} />
          <Row label="דוא״ל" value={acc?.email ?? "—"} />
          <Row label="אימות דו־שלבי" value={acc?.totpEnabled ? "פעיל" : "כבוי"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>החלפת סיסמה</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>אימות דו־שלבי</CardTitle>
        </CardHeader>
        <CardContent>
          <TotpEnroll enabled={acc?.totpEnabled ?? false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>התראות Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-ink-soft">
            התראות שמגיעות למכשיר גם כשהמערכת סגורה. ההפעלה היא פר-מכשיר ופר-דפדפן. אפשר גם להוסיף
            את המערכת למסך הבית (שיתוף → הוספה למסך הבית) ולהשתמש בה כאפליקציה.
          </p>
          <PushToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>זמינות וקביעת תורים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-soft">
            הגדרת שעות העבודה השבועיות, תאריכים חסומים, והאם מטופלים יכולים לקבוע תור בעצמם לפי
            החלונות הפנויים.
          </p>
          <Link
            href="/t/settings/availability"
            className="text-sage-deep inline-flex items-center gap-1 font-semibold hover:underline"
          >
            לניהול הזמינות ←
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>סוגי טיפול</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-soft">
            ניהול רשימת סוגי הטיפול (נטורופתיה, רפלקסולוגיה, תזונה…) — הוספה, שינוי שם והשבתה.
            הרשימה מתעדכנת אוטומטית בכל מקום שבוחרים סוג טיפול.
          </p>
          <Link
            href="/t/settings/treatment-types"
            className="text-sage-deep inline-flex items-center gap-1 font-semibold hover:underline"
          >
            לניהול סוגי הטיפול ←
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>סדרות טיפול</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-soft">
            הגדרת חבילות מפגשים (שם + מספר מפגשים) לבחירה בהקמת מטופל או מהתיק שלו.
          </p>
          <Link
            href="/t/settings/series"
            className="text-sage-deep inline-flex items-center gap-1 font-semibold hover:underline"
          >
            לניהול סדרות הטיפול ←
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>שאלונים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-soft">
            מאגר השאלונים שנשלחים למטופלים. בהקמת מטופל/ת אפשר לבחור אילו שאלונים לשלוח — יותר מאחד.
          </p>
          <Link
            href="/t/settings/questionnaires"
            className="text-sage-deep inline-flex items-center gap-1 font-semibold hover:underline"
          >
            לניהול השאלונים ←
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>מדדי מפגש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-soft">
            ניהול הפרמטרים שנרשמים בכל תיעוד מפגש (משקל, אנרגיה, שינה…) — הוספה, שינוי שם, סדר
            והשבתה. מה שמוגדר כאן מופיע אוטומטית בטופס המפגש.
          </p>
          <Link
            href="/t/settings/fields"
            className="text-sage-deep inline-flex items-center gap-1 font-semibold hover:underline"
          >
            לניהול מדדי המפגש ←
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>יומן Google</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {banner && (
            <p
              className={
                banner.ok
                  ? "text-sage-deep bg-sage-soft/40 rounded-lg px-3 py-2 text-[13px]"
                  : "text-danger bg-danger/5 rounded-lg px-3 py-2 text-[13px]"
              }
            >
              {banner.text}
            </p>
          )}

          {!gcal.configured ? (
            <p className="text-ink-faint">
              החיבור ל-Google Calendar עדיין לא הוגדר בשרת (חסרים משתני סביבה).
            </p>
          ) : gcal.connected ? (
            <>
              <p className="text-sage-deep flex items-center gap-2 font-semibold">
                <span className="bg-sage-soft grid size-5 place-items-center rounded-full text-[11px]">
                  ✓
                </span>
                מחובר{gcal.connectedAt ? ` · מ-${dateFmt.format(gcal.connectedAt)}` : ""}
              </p>
              <p className="text-ink-soft text-[13px]">
                פגישות מהמערכת מסונכרנות ליומן שלך, ואירועים ביומן Google חוסמים שעות מהקביעה
                העצמית. בכותרת האירוע מופיע שם פרטי בלבד.
              </p>
              {gcal.lastError && (
                <p className="text-amber-ink text-[12px]">שגיאת סנכרון אחרונה: {gcal.lastError}</p>
              )}
              <form action={disconnectGoogleAction}>
                <Button type="submit" variant="outline" size="sm">
                  ניתוק
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-ink-soft">
                חברו את יומן Google שלכם — פגישות המערכת יופיעו בו, וזמנים תפוסים בו לא יוצעו
                למטופלים בקביעה עצמית.
              </p>
              <Button asChild size="sm">
                <a href="/api/integrations/google/connect">חיבור ליומן Google</a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>בקרוב</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-[13px]">
          {SOON.map((s) => (
            <p key={s} className="text-ink-soft flex items-center gap-2">
              <Icon name="clock" size={14} className="text-ink-faint" /> {s}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span className="text-ink-faint">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
