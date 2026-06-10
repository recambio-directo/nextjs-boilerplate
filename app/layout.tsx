import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "./components/CookieBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "Recambio Directo",
  description: "Marketplace B2B de recambios de automoción",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Recambio Directo",
    startupImage: "/icons/icon-512x512.png",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
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