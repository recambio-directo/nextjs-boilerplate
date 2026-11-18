"use client";

// Mismo marco que el panel del taller (cabecera + menú lateral + asistente).
// El layout común solo lo aplica si el usuario es un taller; el resto ve la página como siempre.
import DashboardLayout from "../dashboard/layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
