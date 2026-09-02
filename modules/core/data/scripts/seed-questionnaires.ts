import "../load-env";
import { and, eq } from "drizzle-orm";
import { getDb } from "../client";
import { therapist } from "@/modules/core/auth/schema";
import { questionnaireTemplate } from "@/modules/questionnaires/schema";
import { createFieldDef, type NewFieldInput } from "@/modules/core/fields/internal/manage";

/**
 * One-off seed: Nofar's three intake questionnaires (WP-67), lifted from her
 * Google Forms. Idempotent — a template already present (by name) is skipped.
 * Run: pnpm tsx modules/core/data/scripts/seed-questionnaires.ts
 */

type Q = { q: string; input: NewFieldInput };
const t = (q: string, required = true, maxLength = 2000): Q => ({
  q,
  input: { labelHe: q, type: "text", maxLength, required },
});
const date = (q: string): Q => ({ q, input: { labelHe: q, type: "date", required: true } });
const scale = (q: string, min: number, max: number): Q => ({
  q,
  input: { labelHe: q, type: "scale", min, max, required: true },
});
const select = (q: string, options: string[]): Q => ({
  q,
  input: { labelHe: q, type: "select", options, required: true },
});
const confirm = (q: string): Q => ({ q, input: { labelHe: q, type: "boolean", required: true } });

const NATUROPATHY: { name: string; intro: string; questions: Q[] } = {
  name: "שאלון נטורופתי ראשוני לקראת הייעוץ",
  intro:
    "השאלון מיועד לספק לי רקע על אורח החיים שלך ולסייע בהתאמת הטיפול עבורך.\n" +
    "אין צורך לשתף מידע רפואי רגיש, והתשובות נשמרות חסויות.\n" +
    "במפגש הראשון נענה יחד על שאלות נוספות.",
  questions: [
    t("שם מלא", true, 200),
    date("תאריך לידה"),
    t("האם עבר/ת בעבר טיפול או ייעוץ נטורופתי / תזונתי?"),
    t("מה הסיבה העיקרית שהובילה אותך להגיע לטיפול / ייעוץ נטורופתי?"),
    t("מהו האתגר הכי גדול שלך בנוגע לאכילה בריאה?"),
    t("כיצד את/ה מגדיר/ה את תזונתך באופן כללי? (מאוזנת, צמחונית, טבעונית, דלת פחמימות, ללא הגדרה)"),
    select("כמה ארוחות עיקריות את/ה אוכל/ת ביום בממוצע?", ["1–2", "3", "4 ומעלה"]),
    t("האם את/ה צורכ/ת תוספי תזונה על בסיס קבוע? אם כן — פרט/י אילו."),
    scale("עד כמה את/ה מרוצה מהרגלי האכילה שלך? (1 = כלל לא, 5 = מאוד)", 1, 5),
    select("האם את/ה חווה תחושת עייפות או חוסר אנרגיה לעיתים קרובות?", [
      "רוב הזמן",
      "לעיתים",
      "כמעט ולא",
    ]),
    select("עד כמה את/ה מרגיש/ה שהמתח בחייך משפיע על הרגלי האכילה שלך?", [
      "במידה רבה",
      "במידה בינונית",
      "כמעט ולא",
    ]),
    t("האם יש לך רגישות או אלרגיה למזון כלשהו שכדאי שאדע עליה? (אם כן — איזה)"),
    t("האם יש מגבלות תזונתיות נוספות שחשוב שאדע עליהן? (למשל: ללא גלוטן, ללא חלב, כשרות)"),
    select("האם את בהריון?", ["כן", "לא"]),
    t("אשמח שתציינ/י שתי מטרות שהיית רוצה להשיג במהלך התהליך שלנו יחד"),
    t("האם יש משהו נוסף שחשוב שאדע לפני הטיפול?"),
    confirm("אני מבין/ה שהשאלון משמש למטרות ייעוץ תזונתי / נטורופתי בלבד ואינו מחליף ייעוץ רפואי"),
  ],
};

const REFLEXOLOGY: { name: string; intro: string; questions: Q[] } = {
  name: "שאלון ראשוני רפלקסולוגיה",
  intro:
    "השאלון מיועד לספק לי רקע על אורח החיים שלך ולסייע בהתאמת הטיפול הרפלקסולוגי עבורך.\n" +
    "אין צורך לשתף מידע רפואי רגיש, והתשובות נשמרות חסויות.\n" +
    "במפגש הראשון נענה יחד על שאלות נוספות.",
  questions: [
    t("שם מלא", true, 200),
    date("תאריך לידה"),
    t("האם עבר/ת בעבר טיפול רפלקסולוגיה?"),
    t("מה הסיבה העיקרית שהובילה אותך להגיע לטיפול רפלקסולוגי?"),
    t("האם יש בעיה רפואית או מגבלה פיזית שכדאי שאדע עליה לפני תחילת הטיפול?"),
    t("האם יש לך כאבים כרוניים או אזור מסוים בגוף שמפריע וחשוב לך שנתמקד בו בטיפול?"),
    t("האם יש משהו נוסף שחשוב לי לדעת לפני הטיפול?"),
    select("האם את בהריון?", ["כן", "לא"]),
    confirm("אני מבין/ה שהטיפול הרפלקסולוגי הוא טיפול משלים ואינו מהווה תחליף לייעוץ רפואי"),
  ],
};

const AGREEMENT: { name: string; intro: string; questions: Q[] } = {
  name: "טופס הסכם טיפולי – ליווי אישי",
  intro: [
    "היי, שמי נופר כהן, נטורופתית הרבליסטית קלינית המתמחה בירידה במשקל לאמהות ולנשים עסוקות, חיטוב ואורח חיים בריא.",
    "חשוב לי שתקבלו את המענה והשירות המקצועי הטוב ביותר, ולכן הכנתי כמה שאלות חשובות שיעזרו לי להתאים לכם/ן תוכנית תזונה או טיפול מגע מדויקת.",
    "",
    "לתהליך ירידה במשקל יש השלכות בריאותיות (הורדת אחוזי שומן, כולסטרול, שינוי במדדי לחץ דם וירידה בסוכר בדם). השינויים עלולים לגרום לעיתים לסחרחורות, חולשה ועייפות, ולכן חשוב מאוד להקפיד על התפריט וללכת לפי ההנחיות ולא לבצע קיזוזים מסוכנים על דעת עצמכם. מטרת הליווי היא להביא כל אחד ואחת לתוצאות הטובות ביותר; אם נעשים שינויים בניגוד להמלצתי המקצועית — האחריות על הלקוח/ה.",
    "",
    "הליווי האישי כולל: תשאול מעמיק ומעבר על בדיקות דם עדכניות (אם יש), בניית תפריט אישי, מדידות ושקילה, הנחיות תזונה וחוברת מתכונים / רשימת קניות לפי הצורך, מעקב שבועי בהודעות, ודגשים על הרגלי אכילה, איזון ואכילה רגשית.",
    "",
    "זמני הפגישות: פגישת תזונה ראשונה 45–50 דק׳, שאר המפגשים 30–40 דק׳, אחת לשבוע (ובמידת הצורך אחת לשבועיים). חשוב לשים לב לתוקף הסדרה שנבחרה — לא ניתן לדחות פגישות מעבר לשבועיים. טיפולי מגע — 50 דק׳ לטיפול.",
    "",
    "זמינות: זמינה עבור המטופל/ת בשעות 09:00–13:00 ובשעות 20:00–20:30 (בימי שישי עד 12:00). הפגישה נקבעת מראש מול הזמינות ובאישור המטופל/ת; ללא אישור התאריך לא ישוריין.",
    "",
    "דחייה / ביטול מפגשים: יש להודיע לפחות 24 שעות מראש. מפגש שמבוטל בפחות מ-24 שעות יחויב ב-50% מעלות המפגש. מפגש ראשון שיבוטל בפחות מ-12 שעות יחויב ב-300 ₪ (והיתרה תוחזר).",
    "",
    "יש למלא את הטופס הנוכחי ואת טופס הצהרת הבריאות טרם המפגש הראשון. בהצלחה :)",
  ].join("\n"),
  questions: [
    t("שם מלא", true, 200),
    date("תאריך לידה"),
    t("מייל", true, 200),
    t("טלפון", true, 40),
    select("מטרת הטיפול אליו הגעתי", [
      "ירידה במשקל / ייעוץ תזונתי ונטורופתי",
      "ייעוץ לצמחי מרפא",
      "טיפול רפלקסולוגיה",
      "אחר",
    ]),
    t("מטרות / ציפיות מתהליך הטיפול"),
    t("ציפיות שיש לי מתהליך הליווי"),
    select("תדירות המפגשים שאני מעוניין/ת בה", ["אחת לשבוע", "אחת לשבועיים", "אחר"]),
    date("תאריך מילוי הטופס"),
    confirm(
      "אני מאשר/ת כי כל המידע שמילאתי נכון ומדויק, הבנתי את מדיניות הביטולים כפי שמפורטת בהסכם זה, ואני מסכים/ה לפעול בהתאם לתנאי ההסכם",
    ),
  ],
};

const ALL = [NATUROPATHY, REFLEXOLOGY, AGREEMENT];

async function main() {
  const db = getDb();
  const ts = await db.select({ id: therapist.id }).from(therapist);
  if (ts.length === 0) {
    console.log("no therapist rows — nothing to seed");
    return;
  }

  for (const th of ts) {
    let order = 0;
    for (const tpl of ALL) {
      order += 10;
      const existing = await db
        .select({ id: questionnaireTemplate.id })
        .from(questionnaireTemplate)
        .where(
          and(
            eq(questionnaireTemplate.therapistId, th.id),
            eq(questionnaireTemplate.name, tpl.name),
          ),
        )
        .limit(1);
      if (existing[0]) {
        console.log(`skip (exists): ${tpl.name}`);
        continue;
      }

      const [row] = await db
        .insert(questionnaireTemplate)
        .values({
          therapistId: th.id,
          name: tpl.name,
          descriptionHe: tpl.intro,
          sortOrder: order,
        })
        .returning({ id: questionnaireTemplate.id });

      for (const { input } of tpl.questions) {
        await createFieldDef(db, th.id, "questionnaire", input, row.id);
      }
      console.log(`seeded: ${tpl.name} (${tpl.questions.length} questions) for ${th.id}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
