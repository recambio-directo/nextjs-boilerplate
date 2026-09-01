// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.recambio-directo.com";
  const ahora = new Date();

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
  ];
}