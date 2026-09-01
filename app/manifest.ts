import type { MetadataRoute } from "next";
import { BRAND, BRAND_SLOGAN } from "@/lib/brand";

/** PWA manifest (WP-65) — served at /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND,
    short_name: BRAND,
    description: BRAND_SLOGAN,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "he",
    dir: "rtl",
    background_color: "#fefbf1",
    theme_color: "#8aa287",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
