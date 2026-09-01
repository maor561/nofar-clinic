/**
 * Hebrew RTL email templates. Inline styles only — email clients strip <style>.
 * Each returns { subject, html, text }.
 */

const SAGE = "#4e6b58";
const INK = "#2c3630";
const MUTED = "#6c756e";
const LINE = "#ebe7de";
const GROUND = "#faf8f4";

function layout(bodyHtml: string): string {
  return `<!doctype html>
<html lang="he" dir="rtl">
<body style="margin:0;padding:0;background:${GROUND};font-family:Arial,'Helvetica Neue',sans-serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GROUND};padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden">
        <tr><td style="padding:22px 26px;border-bottom:1px solid ${LINE}">
          <span style="font-size:18px;font-weight:bold;color:${SAGE}">Momentum</span>
          <span style="font-size:12px;color:${MUTED}"> · נופר כהן</span>
        </td></tr>
        <tr><td style="padding:26px">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 26px;border-top:1px solid ${LINE};font-size:11px;color:${MUTED}">
          הודעה זו נשלחה מ-Momentum, מערכת הקליניקה של נופר כהן. אם לא ציפית לה, אפשר להתעלם.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${SAGE};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 22px;border-radius:10px">${label}</a>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.6">${text}</p>`;
}

export type Template = { subject: string; html: string; text: string };

export function inviteEmail(opts: { inviteUrl: string; patientName?: string }): Template {
  const hi = opts.patientName ? `שלום ${opts.patientName},` : "שלום,";
  return {
    subject: "הזמנה למרחב הטיפולי של נופר כהן",
    html: layout(
      `<h1 style="margin:0 0 12px;font-size:20px">${hi}</h1>` +
        p(
          "נופר כהן הזמינה אותך למרחב הטיפולי האישי שלך — שם תמצאי את תוכנית הטיפול, הפגישות, המשימות וההודעות במקום אחד.",
        ) +
        p("לחצי כאן כדי להגדיר סיסמה ולהיכנס:") +
        `<p style="margin:6px 0 18px">${button(opts.inviteUrl, "כניסה למרחב שלי")}</p>` +
        `<p style="margin:0;font-size:12px;color:${MUTED}">הקישור תקף ל־7 ימים ולשימוש חד־פעמי.</p>`,
    ),
    text: `${hi}\n\nנופר כהן הזמינה אותך למרחב הטיפולי האישי שלך.\nלהגדרת סיסמה וכניסה: ${opts.inviteUrl}\nהקישור תקף ל־7 ימים ולשימוש חד־פעמי.`,
  };
}

export function passwordResetEmail(opts: { resetUrl: string }): Template {
  return {
    subject: "איפוס סיסמה — Momentum",
    html: layout(
      p("קיבלנו בקשה לאיפוס הסיסמה לחשבון שלך.") +
        p("לבחירת סיסמה חדשה:") +
        `<p style="margin:6px 0 18px">${button(opts.resetUrl, "איפוס סיסמה")}</p>` +
        `<p style="margin:0;font-size:12px;color:${MUTED}">הקישור תקף לשעה. אם לא ביקשת לאפס — אפשר להתעלם מההודעה.</p>`,
    ),
    text: `קיבלנו בקשה לאיפוס הסיסמה לחשבון שלך.\nלבחירת סיסמה חדשה: ${opts.resetUrl}\nהקישור תקף לשעה. אם לא ביקשת — התעלם.`,
  };
}

export function upcomingAppointmentEmail(opts: {
  patientName?: string;
  when: string;
  treatmentType: string;
}): Template {
  const hi = opts.patientName ? `שלום ${opts.patientName},` : "שלום,";
  return {
    subject: `תזכורת: פגישה עם נופר ב־${opts.when}`,
    html: layout(
      `<h1 style="margin:0 0 12px;font-size:20px">${hi}</h1>` +
        p(`רק תזכורת לפגישה הקרובה שלך:`) +
        `<p style="margin:0 0 6px;font-size:16px;font-weight:bold">${opts.when}</p>` +
        `<p style="margin:0 0 16px;font-size:13px;color:${MUTED}">${opts.treatmentType}</p>` +
        p("אם צריך לשנות מועד — אפשר להשיב להודעה זו או ליצור קשר עם נופר."),
    ),
    text: `${hi}\n\nתזכורת לפגישה הקרובה שלך:\n${opts.when} · ${opts.treatmentType}\nלשינוי מועד — השב להודעה זו.`,
  };
}

export function planChangedEmail(opts: {
  patientName?: string;
  planUrl: string;
  versionNote?: string;
}): Template {
  const hi = opts.patientName ? `שלום ${opts.patientName},` : "שלום,";
  return {
    subject: "תוכנית הטיפול שלך עודכנה",
    html: layout(
      `<h1 style="margin:0 0 12px;font-size:20px">${hi}</h1>` +
        p("נופר עדכנה את תוכנית הטיפול שלך.") +
        (opts.versionNote ? p(`<b>מה חדש:</b> ${opts.versionNote}`) : "") +
        `<p style="margin:6px 0 4px">${button(opts.planUrl, "צפייה בתוכנית")}</p>`,
    ),
    text:
      `${hi}\n\nנופר עדכנה את תוכנית הטיפול שלך.` +
      (opts.versionNote ? `\nמה חדש: ${opts.versionNote}` : "") +
      `\nצפייה: ${opts.planUrl}`,
  };
}
