import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "./components/CookieBanner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  themeColor: "#020617",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Recambio Directo",
  description: "Marketplace B2B de recambios de automoción",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Recambio Directo",
  },
  icons: {
    icon: [
      { url: "/icons/manifest-icon-192.maskable.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/manifest-icon-512.maskable.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Recambio Directo" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1290-2796.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1179-2556.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <style>{`
          * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { margin: 0; overflow-x: hidden; }
          input, button, textarea, select { font-family: inherit; }
          img { max-width: 100%; }
          @media (max-width: 768px) {
            * { -webkit-overflow-scrolling: touch; }
            input, select, textarea { font-size: 16px !important; }
          }
        `}</style>
      </head>
      <body style={bodyStyle}>
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}

const bodyStyle: React.CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  color: "white",
  background: "linear-gradient(180deg,#020617 0%,#0f172a 100%)",
  fontFamily: "var(--font-geist-sans)",
};