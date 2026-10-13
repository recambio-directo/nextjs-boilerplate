"use client";

// Componente reutilizable para JSON-LD en páginas de provincia
// Uso: <ProvinciaJsonLd provincia="Madrid" comunidad="Comunidad de Madrid" slug="recambios-madrid" />

export default function ProvinciaJsonLd({ provincia, comunidad, slug }: { provincia: string; comunidad: string; slug: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "name": `Recambios de automoción en ${provincia}`,
        "description": `Marketplace B2B de recambios para talleres en ${provincia} (${comunidad}). Compara precios entre proveedores y recibe piezas OEM e IAM en 24h.`,
        "provider": {
          "@type": "Organization",
          "@id": "https://www.recambio-directo.com/#organization",
          "name": "Recambio Directo",
        },
        "areaServed": {
          "@type": "AdministrativeArea",
          "name": comunidad,
          "containedInPlace": { "@type": "Country", "name": "España" },
        },
        "serviceType": "Distribución de recambios de automoción B2B",
        "url": `https://www.recambio-directo.com/${slug}`,
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.recambio-directo.com" },
          { "@type": "ListItem", "position": 2, "name": `Recambios en ${provincia}`, "item": `https://www.recambio-directo.com/${slug}` },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
