import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Icon, Logo } from "@/modules/core/design-system";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של Momentum, כולל חיבור Google Calendar.",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "מי מפעיל/ה את המערכת",
    body: (
      <p>
        Momentum היא מערכת Web פרטית שמפעילה נופר כהן, נטורופתית קלינית, לניהול הקשר הטיפולי מול
        המטופלים והמטופלות שלה בלבד. המערכת אינה פתוחה לציבור הרחב — כל מטופל/ת מצטרפ/ת בהזמנה אישית
        מנופר.
      </p>
    ),
  },
  {
    title: "איזה מידע נאסף",
    body: (
      <>
        <p>בהתאם לתפקיד שלך במערכת:</p>
        <ul className="mt-2 list-disc space-y-1.5 ps-5">
          <li>
            <b className="text-ink font-semibold">פרטי קשר וזיהוי</b> — שם, אימייל, ופרטים דומים
            שנמסרים בהרשמה.
          </li>
          <li>
            <b className="text-ink font-semibold">מידע טיפולי</b> — היסטוריית פגישות, תוכניות טיפול,
            מדדים ותיעוד מפגשים, שאלון קליטה, מסמכים שהועלו.
          </li>
          <li>
            <b className="text-ink font-semibold">מידע תפעולי</b> — לוח פגישות, משימות, התראות, יומן
            פעילות (audit) לצורכי אבטחה.
          </li>
        </ul>
        <p className="mt-2">
          כל מידע כזה נגיש אך ורק למטפלת ולמטופל/ת הרלוונטי/ת — לעולם לא למטופל אחר.
        </p>
      </>
    ),
  },
  {
    title: "חיבור ליומן Google",
    body: (
      <>
        <p>נופר יכולה לחבר את חשבון ה-Google Calendar האישי שלה למערכת, כדי ש:</p>
        <ul className="mt-2 list-disc space-y-1.5 ps-5">
          <li>
            פגישות שנקבעות במערכת יופיעו אוטומטית ביומן Google שלה (כותרת האירוע כוללת{" "}
            <b className="text-ink font-semibold">שם פרטי בלבד</b> של המטופל/ת, ללא פרטי טיפול, ללא
            הערות קליניות).
          </li>
          <li>
            זמנים שכבר תפוסים ביומן ה-Google שלה לא יוצעו כשעות פנויות למטופלים שקובעים תור בעצמם.
          </li>
        </ul>
        <p className="mt-2">לשם כך המערכת ניגשת ל-Google Calendar API בשני scopes בלבד:</p>
        <ul className="mt-2 list-disc space-y-1.5 ps-5">
          <li>
            <code className="bg-surface-2 rounded px-1.5 py-0.5 text-[13px]">calendar.events</code>{" "}
            — יצירה, עדכון ומחיקה של אירועים שהמערכת עצמה יצרה.
          </li>
          <li>
            <code className="bg-surface-2 rounded px-1.5 py-0.5 text-[13px]">
              calendar.freebusy
            </code>{" "}
            — קריאת חלונות זמן תפוסים/פנויים, ללא פרטי האירועים עצמם.
          </li>
        </ul>
        <div className="border-sage bg-sage-soft text-sage-deep mt-3 rounded-lg border-s-[3px] px-4 py-3 text-[13.5px]">
          המידע מ-Google לא משותף עם צד שלישי כלשהו, לא נמכר, ולא משמש לפרסום. טוקן ההרשאה נשמר{" "}
          <b>מוצפן</b> (AES-256-GCM) ומשמש רק לתקשורת עם Google Calendar API בשם המטפלת. ניתן לנתק
          את החיבור בכל רגע ממסך ההגדרות — הדבר מוחק את הטוקן השמור לצמיתות.
        </div>
        <div
          dir="ltr"
          className="border-line text-ink-faint mt-3 rounded-lg border border-dashed px-4 py-3 text-left text-[12.5px] leading-relaxed"
        >
          <b className="text-ink-soft">Google API Services User Data Policy —</b> Nofar
          Clinic&apos;s use and transfer of information received from Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="text-sage-deep underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </div>
      </>
    ),
  },
  {
    title: "איפה המידע נשמר, ואיך הוא מוגן",
    body: (
      <ul className="list-disc space-y-1.5 ps-5">
        <li>
          מסד הנתונים הראשי מאוחסן ב-<b className="text-ink font-semibold">Neon (Postgres)</b>,
          באזור פרנקפורט, גרמניה (האיחוד האירופי).
        </li>
        <li>
          מסמכים וקבצים מאוחסנים ב-<b className="text-ink font-semibold">Vercel Blob</b> במצב פרטי
          בלבד — נגישים רק דרך נתיב מאומת ומסונן.
        </li>
        <li>סיסמאות נשמרות מגובבות (argon2id), לא בטקסט גלוי; למטפלת אימות דו-שלבי אופציונלי.</li>
        <li>כל תקשורת עם המערכת מוצפנת (HTTPS/TLS).</li>
        <li>גישה למידע של מטופל/ת מוגבלת מבנית (ברמת הקוד והמסד) למטפלת ולאותו מטופל/ת בלבד.</li>
      </ul>
    ),
  },
  {
    title: "שמירה ומחיקה",
    body: (
      <p>
        מידע קליני נשמר לפי חובות השמירה המקובלות לרשומות טיפוליות. מטופל/ת יכול/ה לבקש מנופר עיון,
        תיקון או מחיקת המידע שלו/ה — בכפוף לחובות שמירה חוקיות. חיבור Google (אם קיים) ניתן לניתוק
        עצמאי בכל עת דרך הגדרות המערכת.
      </p>
    ),
  },
  {
    title: "הזכויות שלך",
    body: (
      <>
        <p>
          בהתאם לחוק הגנת הפרטיות התשמ״א-1981 (כולל תיקון 13), עומדות לך הזכויות הבאות ביחס למידע
          שנאסף עליך במערכת:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 ps-5">
          <li>זכות עיון במידע שנשמר עליך.</li>
          <li>זכות לבקש תיקון מידע שגוי.</li>
          <li>זכות לבקש מחיקה, בכפוף לחובות שמירה חוקיות של רשומות טיפוליות.</li>
        </ul>
        <p className="mt-2">לכל בקשה כזו, פני/ה ישירות לנופר בפרטי הקשר בתחתית העמוד.</p>
      </>
    ),
  },
  {
    title: "שינויים במדיניות",
    body: (
      <p>
        מדיניות זו עשויה להתעדכן מעת לעת בהתאם לשינויים במערכת או בדרישות רגולטוריות. תאריך העדכון
        האחרון מופיע בראש העמוד.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <header className="mb-8 space-y-3 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <span className="bg-sage-soft text-sage-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold">
          <Icon name="lock" size={13} /> מדיניות פרטיות
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Momentum</h1>
        <p className="text-ink-soft mx-auto max-w-md text-sm">
          איך Momentum — המערכת של נופר כהן לניהול הקשר הטיפולי בנטורופתיה ותזונה — אוספת, משתמשת
          ושומרת על המידע שלך, כולל חיבור אופציונלי ליומן Google.
        </p>
        <p className="text-ink-faint text-[12px] tabular-nums">עודכן לאחרונה: 1 בספטמבר 2026</p>
      </header>

      <div className="space-y-4">
        {SECTIONS.map((s, i) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2.5">
                <span className="text-sage font-[family-name:var(--font-display)] text-base font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-ink-soft space-y-1.5 text-[14.5px] leading-relaxed">
              {s.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="border-line text-ink-faint mt-8 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-[13px]">
        <span>Momentum · מערכת ניהול מטפל–מטופל</span>
        <a href="mailto:nofar@nofar-health.com" className="text-sage-deep hover:underline">
          יצירת קשר: nofar@nofar-health.com
        </a>
      </footer>

      <p className="mt-6 text-center">
        <Link href="/" className="text-ink-faint text-[12.5px] hover:underline">
          ← חזרה לדף הבית
        </Link>
      </p>
    </main>
  );
}
