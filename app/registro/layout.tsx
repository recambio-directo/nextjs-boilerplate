import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta gratis — Registro para talleres y proveedores",
  description:
    "Regístrate en Recambio Directo. Gratis para talleres: busca recambios OEM e IAM y compara precios de proveedores de toda España. Proveedores: 25€/mes sin comisiones.",
  alternates: {
    canonical: "https://www.recambio-directo.com/registro",
  },
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
