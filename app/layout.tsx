import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Recambio Directo",
  description: "Marketplace B2B de recambios de automoción",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#020617" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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