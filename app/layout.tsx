import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "./components/CookieBanner";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
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
  verification: {
    google: "1cHMgv9pHITkaU0phv__RhsEN2_BvdsHNNLqCEi3aHE",
  },
  metadataBase: new URL("https://www.recambio-directo.com"),
  title: {
    default: "Recambio Directo — Marketplace B2B de Recambios de Automoción",
    template: "%s | Recambio Directo",
  },
  description: "Marketplace B2B especializado en recambios de automoción. Conectamos talleres y proveedores en toda España. Busca piezas OEM e IAM, compara precios y recibe en 24h.",
  authors: [{ name: "Recambio Directo", url: "https://www.recambio-directo.com" }],
  creator: "Recambio Directo",
  publisher: "Recambio Directo",
  category: "Automoción",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://www.recambio-directo.com",
    siteName: "Recambio Directo",
    title: "Recambio Directo — Marketplace B2B de Recambios de Automoción",
    description: "Conectamos talleres y proveedores de recambios en toda España. Busca piezas OEM e IAM, compara precios y recibe en 24h.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Recambio Directo — Marketplace B2B de Recambios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Recambio Directo — Marketplace B2B de Recambios",
    description: "Conectamos talleres y proveedores de recambios en toda España. Busca piezas OEM e IAM y recibe en 24h.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Recambio Directo",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/manifest-icon-192.maskable.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/manifest-icon-512.maskable.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
};

// Datos estructurados JSON-LD globales (solo WebSite + Organization).
// FAQ y migas de pan van en cada página, con su contenido real.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.recambio-directo.com/#website",
      "url": "https://www.recambio-directo.com",
      "name": "Recambio Directo",
      "description": "Marketplace B2B de recambios de automoción en España",
      "publisher": { "@id": "https://www.recambio-directo.com/#organization" },
      "inLanguage": "es-ES",
    },
    {
      "@type": "Organization",
      "@id": "https://www.recambio-directo.com/#organization",
      "name": "Recambio Directo",
      "url": "https://www.recambio-directo.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.recambio-directo.com/icons/manifest-icon-512.maskable.png",
        "width": 512,
        "height": 512,
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "info@recambio-directo.com",
        "telephone": "+34650495270",
        "contactType": "customer service",
        "availableLanguage": "Spanish",
        "areaServed": "ES",
      },
      "sameAs": [
        "https://www.instagram.com/recambiodirect/",
        "https://www.linkedin.com/company/135907554",
      ],
      "areaServed": {
        "@type": "Country",
        "name": "España",
      },
      "description": "Marketplace B2B especializado en recambios de automoción. Conectamos talleres y proveedores en toda España.",
      "knowsAbout": ["recambios de automoción", "piezas OEM", "piezas IAM", "marketplace B2B"],
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Recambio Directo" />
        <meta name="geo.region" content="ES" />
        <meta name="geo.placename" content="España" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1290-2796.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1179-2556.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
        <SiteHeader />
        {children}
        <SiteFooter />
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