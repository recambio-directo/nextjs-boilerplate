// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/registro", "/quienes-somos", "/blog", "/blog/"],
        disallow: [
          "/login",
          "/dashboard/",
          "/admin/",
          "/checkout/",
          "/perfil/",
          "/chat/",
          "/api/",
          "/cookies",
          "/devoluciones",
        ],
      },
    ],
    sitemap: "https://www.recambio-directo.com/sitemap.xml",
    host: "https://www.recambio-directo.com",
  };
}
