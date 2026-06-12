// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/registro", "/login", "/legal", "/privacidad", "/terminos"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/checkout/",
          "/perfil/",
          "/chat/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.recambio-directo.com/sitemap.xml",
    host: "https://www.recambio-directo.com",
  };
}