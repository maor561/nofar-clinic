import type { Metadata, Viewport } from "next";
import { Assistant, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { Providers } from "./providers";
import { ServiceWorker } from "@/modules/core/push/service-worker";

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
  title: { default: `${BRAND} — ניהול מטפל–מטופל`, template: `%s — ${BRAND}` },
  description: "מערכת לניהול הקשר הטיפולי בין מטפל למטופליו.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: BRAND },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#8aa287",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${assistant.variable} ${frankRuhl.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
