// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.recambio-directo.com";
  const ahora = new Date();

  const ciudades = ["madrid", "barcelona", "valencia", "sevilla", "bilbao"];

  const blogPosts = [
    "como-elegir-recambios-oem-o-iam",
    "ventajas-marketplace-b2b-recambios",
    "guia-logistica-recambios-automocion",
  ];

  return [
    {
      url: base,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/quienes-somos`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/registro`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Landings de ciudad
    ...ciudades.map((ciudad) => ({
      url: `${base}/recambios-${ciudad}`,
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Blog
    {
      url: `${base}/blog`,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogPosts.map((slug) => ({
      url: `${base}/blog/${slug}`,
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // Páginas legales (E-E-A-T)
    {
      url: `${base}/aviso-legal`,
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/privacidad`,
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terminos`,
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
