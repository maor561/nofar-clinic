"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  Label,
  LoadingCards,
  LoadingRows,
  Logo,
  PatientShell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TherapistShell,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from "@/modules/core/design-system";

const COLORS: [string, string][] = [
  ["sage-deep", "#4e6b58"],
  ["sage", "#7c9885"],
  ["sage-soft", "#e4ede4"],
  ["sage-tint", "#f1f5f0"],
  ["blush", "#ce8a90"],
  ["blush-soft", "#f6e7e8"],
  ["warn / amber-ink", "#9a6b33"],
  ["warn-soft", "#f6ebd9"],
  ["danger / brick", "#a9524a"],
  ["ground", "#faf8f4"],
  ["surface", "#ffffff"],
  ["ink", "#2c3630"],
  ["ink-soft", "#6c756e"],
  ["ink-faint", "#9aa29b"],
  ["line", "#ebe7de"],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-ink font-[family-name:var(--font-display)] text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const [shell, setShell] = useState<"therapist" | "patient">("therapist");

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <Logo subtitle="מערכת עיצוב" />
        <Badge variant="secondary">WP-01 · Calm Wellness</Badge>
      </header>
      <p className="text-ink-soft text-sm">
        כל ה-tokens, הרכיבים, שני ה-Shells ומצבי ריק/טעינה/שגיאה. Light בלבד, RTL מלא.
      </p>

      <Tabs defaultValue="foundations">
        <TabsList>
          <TabsTrigger value="foundations">יסודות</TabsTrigger>
          <TabsTrigger value="components">רכיבים</TabsTrigger>
          <TabsTrigger value="shells">Shells</TabsTrigger>
          <TabsTrigger value="states">מצבים</TabsTrigger>
        </TabsList>

        {/* ---------- FOUNDATIONS ---------- */}
        <TabsContent value="foundations" className="space-y-8 pt-6">
          <Section title="צבע">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {COLORS.map(([name, hex]) => (
                <div key={name} className="space-y-1.5">
                  <div
                    className="border-line h-14 rounded-[10px] border"
                    style={{ background: hex }}
                  />
                  <div className="text-ink text-xs font-semibold">{name}</div>
                  <div className="text-ink-faint text-[11px]" dir="ltr">
                    {hex}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="טיפוגרפיה">
            <div className="border-line bg-surface space-y-3 rounded-[var(--radius-card)] border p-6">
              <p className="font-[family-name:var(--font-display)] text-3xl font-bold">
                Momentum — כותרת ראשית (Frank Ruhl Libre)
              </p>
              <p className="text-ink-soft font-[family-name:var(--font-display)] text-xl font-medium">
                כותרת משנה · 20px
              </p>
              <Separator />
              <p className="text-base">
                גוף הטקסט ב-Assistant. כל מטופל רואה אך ורק את המידע שלו — זו הדרישה הקריטית של
                המערכת, ומכאן נגזר כל מסך.
              </p>
              <p className="text-ink-soft text-[13.5px]">טקסט משני · 13.5px · ink-soft</p>
              <p className="text-ink-faint text-[11px] font-bold tracking-[0.06em] uppercase">
                תווית · 11px · tracking
              </p>
              <p className="text-2xl font-bold tabular-nums">1,234.56 — tabular-nums למספרים</p>
            </div>
          </Section>

          <Section title="צורה">
            <div className="flex flex-wrap gap-4">
              <div className="border-line bg-surface rounded-[var(--radius-card)] border p-5 text-sm shadow-[var(--shadow-card)]">
                כרטיס · radius-card 16px · shadow-card
              </div>
              <div className="border-line bg-surface rounded-[var(--radius-control)] border p-5 text-sm">
                פקד · radius-control 10px
              </div>
              <div className="bg-sage-soft text-sage-deep rounded-full px-5 py-2 text-sm font-semibold">
                pill · full
              </div>
            </div>
          </Section>
        </TabsContent>

        {/* ---------- COMPONENTS ---------- */}
        <TabsContent value="components" className="space-y-8 pt-6">
          <Section title="כפתורים">
            <div className="flex flex-wrap items-center gap-3">
              <Button>ראשי</Button>
              <Button variant="secondary">משני</Button>
              <Button variant="outline">מתאר</Button>
              <Button variant="ghost">שקוף</Button>
              <Button variant="destructive">מחיקה</Button>
              <Button variant="link">קישור</Button>
              <Button size="sm">קטן</Button>
              <Button size="lg">
                <Icon name="plus" size={16} /> עם אייקון
              </Button>
              <Button disabled>מושבת</Button>
            </div>
          </Section>

          <Section title="שדות טופס">
            <div className="grid max-w-xl gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="d-name">שם המטופל/ת</Label>
                <Input id="d-name" placeholder="לדוגמה: מיכל אברהם" defaultValue="מיכל אברהם" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-goal">יעד טיפול</Label>
                <Textarea id="d-goal" defaultValue="ירידה במשקל וייצוב רמות אנרגיה" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-type">סוג טיפול</Label>
                <Select defaultValue="nat">
                  <SelectTrigger id="d-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nat">נטורופתיה</SelectItem>
                    <SelectItem value="ref">רפלקסולוגיה</SelectItem>
                    <SelectItem value="nut">תזונה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox defaultChecked /> צרף המלצות לגרסת התוכנית הבאה
              </label>
            </div>
          </Section>

          <Section title="כרטיס">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>הפגישה הבאה שלך</CardTitle>
                <CardDescription>17 בספטמבר · 10:30 · נטורופתיה</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm">הוספה ליומן</Button>
                <Button size="sm" variant="ghost">
                  בקשת שינוי
                </Button>
              </CardContent>
            </Card>
          </Section>

          <Section title="תגיות וסטטוסים">
            <div className="flex flex-wrap gap-2">
              <Badge>ברירת מחדל</Badge>
              <Badge variant="secondary">נטורופתיה</Badge>
              <Badge variant="outline">רפלקסולוגיה</Badge>
              <Badge variant="destructive">באיחור</Badge>
              <span className="bg-sage-soft text-sage-deep inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold">
                פעיל
              </span>
              <span className="bg-warn-soft text-warn inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold">
                מושהה
              </span>
              <span className="bg-line-soft text-ink-soft inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold">
                הושלם
              </span>
            </div>
          </Section>

          <Section title="טבלה">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פגישה אחרונה</TableHead>
                    <TableHead>פגישה הבאה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["מיכל אברהם", "פעיל", "14 אוג׳", "היום · 09:00"],
                    ["רותם לוי", "פעיל", "21 אוג׳", "היום · 10:30"],
                    ["שירה כהן", "מושהה", "3 יולי", "—"],
                  ].map(([n, s, last, next]) => (
                    <TableRow key={n}>
                      <TableCell className="font-semibold">{n}</TableCell>
                      <TableCell className="text-ink-soft">{s}</TableCell>
                      <TableCell className="text-ink-soft tabular-nums">{last}</TableCell>
                      <TableCell className="tabular-nums">{next}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Section>

          <Section title="Overlay ו-Feedback">
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">פתיחת מודאל</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>פרסום גרסה 4 של תוכנית הטיפול</DialogTitle>
                    <DialogDescription>
                      הגרסה הנוכחית תישמר בהיסטוריה, המטופלת תקבל התראה, וייווצר אירוע ב-Timeline.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">ביטול</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={() => toast.success("גרסה 4 פורסמה")}>פרסום</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={() => toast.success("נשמר בהצלחה")}>
                טוסט הצלחה
              </Button>
              <Button variant="outline" onClick={() => toast.error("שמירה נכשלה — נסו שוב")}>
                טוסט שגיאה
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost">
                    <Icon name="info" size={16} /> Tooltip
                  </Button>
                </TooltipTrigger>
                <TooltipContent>גלוי למטפל בלבד</TooltipContent>
              </Tooltip>
            </div>
          </Section>
        </TabsContent>

        {/* ---------- SHELLS ---------- */}
        <TabsContent value="shells" className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={shell === "therapist" ? "default" : "outline"}
              onClick={() => setShell("therapist")}
            >
              Shell מטפל
            </Button>
            <Button
              size="sm"
              variant={shell === "patient" ? "default" : "outline"}
              onClick={() => setShell("patient")}
            >
              Shell מטופל
            </Button>
          </div>

          <div className="border-line h-[560px] overflow-auto rounded-[var(--radius-card)] border">
            {shell === "therapist" ? (
              <TherapistShell user={{ name: "נופר כהן", role: "נטורופתית · מנהלת" }}>
                <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                  מטופלים
                </h1>
                <p className="text-ink-soft text-sm">
                  אזור התוכן. הניווט מימין; הפריט הפעיל נגזר מכתובת ה-URL.
                </p>
              </TherapistShell>
            ) : (
              <PatientShell user={{ name: "מיכל אברהם" }}>
                <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                  שלום מיכל
                </h1>
                <p className="text-ink-soft text-sm">ניווט עליון, תוכן ממורכז וצר יותר.</p>
              </PatientShell>
            )}
          </div>
        </TabsContent>

        {/* ---------- STATES ---------- */}
        <TabsContent value="states" className="space-y-8 pt-6">
          <Section title="ריק">
            <EmptyState
              icon="users"
              title="עדיין אין מטופלים"
              description="הוסיפו מטופל ראשון ושלחו לו הזמנה — לוקח דקה."
              action={
                <Button size="sm">
                  <Icon name="plus" size={16} /> מטופל חדש
                </Button>
              }
            />
          </Section>
          <Section title="שגיאה">
            <ErrorState
              action={
                <Button size="sm" variant="outline">
                  רענון
                </Button>
              }
            />
          </Section>
          <Section title="טעינה">
            <div className="space-y-4">
              <LoadingCards count={4} />
              <LoadingRows rows={3} />
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
