import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiénes Somos — Marketplace B2B de Recambios de Automoción",
  description:
    "Conoce Recambio Directo: la plataforma B2B que conecta talleres y proveedores de recambios de automoción en toda España. Sin intermediarios, con precio fijo mensual.",
  alternates: {
    canonical: "https://www.recambio-directo.com/quienes-somos",
  },
};

export default function QuienesSomosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
