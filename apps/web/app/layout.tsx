import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { Providers } from "./providers";
import "./globals.css";

// Playwrite NZ Basic (handwritten "dhun" wordmark + accents) + Host Grotesk
// (everything else). Loaded via <link> and referenced by family name in
// globals.css, since neither is in this Next version's next/font manifest.
const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=Playwrite+NZ+Basic:wght@100..400&display=swap";

// Runs before first paint:
//  1. Keep local dev on one origin — `NEXTAUTH_URL` and Spotify's redirect URI
//     are pinned to `127.0.0.1`, so a visit to `localhost:3000` would be
//     bounced to a different origin (its own cookies/localStorage) by the
//     OAuth round-trip.
//  2. Stamp <html data-reduced-motion> from the saved cookie, or the OS
//     `prefers-reduced-motion` setting if there's no saved choice yet — so the
//     record's spin state is correct on the very first frame, with no flash.
const BOOT_SCRIPT = `
if(location.hostname==="localhost"){location.replace(location.href.replace("//localhost","//127.0.0.1"))}
var m=document.cookie.match(/(?:^|; )dhun_reduced_motion=(true|false)/);
document.documentElement.dataset.reducedMotion=m?m[1]:(matchMedia("(prefers-reduced-motion: reduce)").matches?"true":"false");
`.trim();

export const metadata: Metadata = {
  metadataBase: new URL("http://127.0.0.1:3000"),
  title: "dhun — sing along in any language",
  description:
    "search a song, drop the needle, and follow along with lyrics translated into your language. karaoke for songs you can't read.",
  openGraph: {
    title: "dhun",
    description:
      "search a song, drop the needle, and follow the lyrics in your language.",
    images: ["/console.jpg"],
  },
  icons: {
    icon: "/console.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17130f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the persisted motion preference here so the very first paint is already
  // correct — the state never has to be re-derived on the client after a
  // navigation or an OAuth round-trip.
  const reducedMotion = cookies().get("dhun_reduced_motion")?.value === "true";

  return (
    <html lang="en" data-reduced-motion={String(reducedMotion)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      </head>
      <body>
        <Providers initialReducedMotion={reducedMotion}>{children}</Providers>
      </body>
    </html>
  );
}
