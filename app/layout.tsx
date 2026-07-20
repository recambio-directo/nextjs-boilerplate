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
  verification: {
    google: "1cHMgv9pHITkaU0phv__RhsEN2_BvdsHNNLqCEi3aHE",
  },
  metadataBase: new URL("https://www.recambio-directo.com"),
  title: {
    default: "Recambio Directo — Marketplace B2B de Recambios de Automoción",
    template: "%s | Recambio Directo",
  },
  description: "Marketplace B2B especializado en recambios de automoción. Conectamos talleres y proveedores en toda España. Busca piezas OEM e IAM, compara precios y recibe en 24h.",
  keywords: [
    "recambios automoción B2B",
    "marketplace recambios",
    "piezas de coche",
    "recambios taller",
    "recambios OEM",
    "recambios IAM",
    "distribuidor recambios España",
    "comprar recambios online",
    "recambios para talleres",
    "proveedor recambios",
    "piezas automóvil",
    "recambios mecánicos",
  ],
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
  alternates: {
    canonical: "https://www.recambio-directo.com",
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

// Datos estructurados JSON-LD para Google
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.recambio-directo.com/#website",
      "url": "https://www.recambio-directo.com",
      "name": "Recambio Directo",
      "description": "Marketplace B2B de recambios de automoción en España",
      "inLanguage": "es-ES",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.recambio-directo.com/dashboard/buscar?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
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
        "contactType": "customer service",
        "availableLanguage": "Spanish",
      },
      "areaServed": "ES",
      "description": "Marketplace B2B especializado en recambios de automoción. Conectamos talleres y proveedores en toda España.",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "¿Cuánto cuesta Recambio Directo?", "acceptedAnswer": { "@type": "Answer", "text": "El primer mes es completamente gratuito. A partir del segundo mes, el precio es de 25€/mes sin permanencia ni costes ocultos." } },
        { "@type": "Question", "name": "¿Quién puede registrarse?", "acceptedAnswer": { "@type": "Answer", "text": "La plataforma es exclusiva para profesionales del sector: talleres mecánicos, concesionarios, distribuidores y proveedores de recambios." } },
        { "@type": "Question", "name": "¿Cuánto tarda en activarse mi cuenta?", "acceptedAnswer": { "@type": "Answer", "text": "Verificamos cada cuenta manualmente en menos de 24 horas laborables." } },
        { "@type": "Question", "name": "¿Qué agencias de transporte están disponibles?", "acceptedAnswer": { "@type": "Answer", "text": "Trabajamos con GLS, MRW, NACEX, SEUR, Correos Express y CTT Express." } },
        { "@type": "Question", "name": "¿Cómo funciona RD Pago?", "acceptedAnswer": { "@type": "Answer", "text": "RD Pago es nuestra línea de crédito para talleres. Permite comprar ahora y pagar en 15 días. Se activa tras 1 mes de actividad y 1 pago con tarjeta." } },
      ],
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <meta name="geo.region" content="ES" />
        <meta name="geo.placename" content="España" />
        <meta name="language" content="Spanish" />
        <meta name="revisit-after" content="7 days" />
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