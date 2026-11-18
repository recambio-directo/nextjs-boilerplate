import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las páginas
const cabecerasSeguridad = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self \"https://js.stripe.com\")" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad }];
  },
  async redirects() {
    return [
      // Bilbao y Vizcaya eran la misma landing duplicada: queda una sola URL
      { source: "/recambios-bilbao", destination: "/recambios-vizcaya", permanent: true },
    ];
  },
};

export default nextConfig;
