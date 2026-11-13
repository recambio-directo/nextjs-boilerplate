import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Bilbao y Vizcaya eran la misma landing duplicada: queda una sola URL
      { source: "/recambios-bilbao", destination: "/recambios-vizcaya", permanent: true },
    ];
  },
};

export default nextConfig;
