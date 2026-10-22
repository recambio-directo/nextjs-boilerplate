import type { Metadata } from "next";
import ProveedorDashboard from "./ProveedorPanel";

export const metadata: Metadata = {
  title: "Panel Proveedor — Recambio Directo",
  description: "Panel de gestión para proveedores de Recambio Directo. Gestiona tu stock, pedidos y configuración.",
};

export default function ProveedorPage() {
  return <ProveedorDashboard />;
}
