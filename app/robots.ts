// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/registro", "/quienes-somos"],
        disallow: [
          "/login",
          "/dashboard/",
          "/admin/",
          "/checkout/",
          "/perfil/",
          "/chat/",
          "/api/",
          "/legal",
          "/privacidad",
          "/terminos",
          "/cookies",
          "/aviso-legal",
          "/devoluciones",
        ],
      },
    ],
    sitemap: "https://www.recambio-directo.com/sitemap.xml",
    host: "https://www.recambio-directo.com",
  };
}