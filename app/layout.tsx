import type { Metadata } from "next";
import { Assistant, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "נופר — ניהול מטפל–מטופל",
  description: "מערכת לניהול הקשר הטיפולי בין מטפל למטופליו.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${assistant.variable} ${frankRuhl.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
