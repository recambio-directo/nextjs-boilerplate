// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.recambio-directo.com";
  const ahora = new Date();

  // Slugs que coinciden EXACTAMENTE con las carpetas /app/recambios-{slug}/
  const provincias = [
    "alava", "albacete", "alicante", "almeria", "asturias",
    "badajoz", "baleares", "barcelona", "bilbao", "burgos",
    "caceres", "cadiz", "cantabria", "castellon", "ciudad-real",
    "cordoba", "cuenca", "girona", "granada", "guadalajara",
    "guipuzcoa", "huelva", "huesca", "jaen", "la-coruna",
    "la-rioja", "las-palmas", "leon", "lleida", "lugo",
    "madrid", "malaga", "murcia", "navarra", "ourense",
    "palencia", "pontevedra", "salamanca", "santa-cruz-de-tenerife",
    "segovia", "sevilla", "soria", "tarragona", "teruel",
    "toledo", "valencia", "valladolid", "vizcaya", "zamora",
    "zaragoza",
  ];

  const blogPosts = [
    "como-elegir-recambios-oem-o-iam",
    "ventajas-marketplace-b2b-recambios",
    "guia-logistica-recambios-automocion",
    "como-encontrar-nuevos-proveedores-recambios",
    "vender-recambios-online-b2b",
    "buscar-recambios-por-matricula-como-funciona",
    "marketplace-b2b-vs-distribuidor-tradicional",
    "reducir-costes-recambios-taller",
    "como-ahorrar-recambios-taller",
    "comparar-precios-recambios-online",
    "buscar-recambios-por-referencia-oem",
    "mejores-marcas-recambios-aftermarket",
  ];

  const categorias = [
    "frenos", "filtros", "embragues", "suspension", "distribucion",
    "aceites", "baterias", "escape", "direccion", "encendido",
  ];

  const marcas = [
    "brembo", "bosch", "mann-filter", "sachs", "luk", "valeo", "trw",
    "febi-bilstein", "monroe", "ngk", "denso", "continental", "skf", "ina", "gates",
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
      priority: 0.9,
    },
    // Landing proveedores
    {
      url: `${base}/para-proveedores`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Landing talleres
    {
      url: `${base}/para-talleres`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Landing búsqueda por matrícula
    {
      url: `${base}/buscar-por-matricula`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Landings de categoría
    ...categorias.map((cat) => ({
      url: `${base}/recambios/${cat}`,
      lastModified: ahora,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Landings de marca
    ...marcas.map((marca) => ({
      url: `${base}/marcas/${marca}`,
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Landings de provincia (slugs = nombres de carpeta)
    ...provincias.map((prov) => ({
      url: `${base}/recambios-${prov}`,
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
      priority: 0.7,
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
