export type Usuario = {
  id: string;
  email: string;
  tipo: string;
  nombre_empresa?: string;
  telefono?: string;
  cif?: string;
  ciudad?: string;
  provincia?: string;
  activo: boolean;
  fecha_registro?: string;
  suscripcion: string;
  notas_admin?: string;
  ftp_activo?: boolean;
  ftp_usuario?: string;
  ftp_api_key?: string;
  credito_rd?: number;
  credito_rd_maximo?: number;
  iban?: string;
  direccion?: string;
  codigo_postal?: string;
  ultimo_acceso?: string;
  rd_pago_activo?: boolean;
  vehiculo_activo?: boolean;
};

export type Pedido = {
  id: number;
  codigo?: string;
  cliente_email?: string;
  cliente_nombre?: string;
  cliente_id?: string;
  total?: number;
  subtotal?: number;
  estado_envio?: string;
  forma_pago?: string;
  coste_transporte?: number;
  fecha_entrega_confirmada?: string;
  pago_proveedor_estado?: string;
  anulado?: boolean;
  created_at?: string;
  productos?: any[];
  agencia?: string;
  transporte?: string;
  direccion?: string;
  albaran_url?: string;
  etiqueta_envio_url?: string;
  tracking_number?: string;
  tracking?: string;
  tracking_nacex?: string;
  tracking_dhl?: string;
  tracking_gls?: string;
  tracking_ctt?: string;
  tracking_seur?: string;
  tracking_mrw?: string;
  cliente_telefono?: string;
  gastos_gestion?: number;
  peso_kg?: number;
  estado_pago?: string;
  notas_internas?: string;
  motivo_anulacion?: string;
  albaran_proveedor_url?: string;
  etiqueta_nacex_url?: string;
  etiqueta_seur_url?: string;
  etiqueta_mrw_url?: string;
  etiqueta_dhl_url?: string;
};

export type PagoProveedor = {
  id: number;
  pedido_id: number;
  proveedor_id: string;
  importe: number;
  estado: string;
  fecha_entrega?: string;
  fecha_pago_programado?: string;
  fecha_pago_realizado?: string;
  created_at?: string;
};

export const SUSCRIPCION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  gratuito:  { label: "Gratuito",  color: "#fbbf24", bg: "rgba(245,158,11,0.15)" },
  activo:    { label: "Activo",    color: "#4ade80", bg: "rgba(22,163,74,0.15)" },
  pendiente: { label: "Pendiente", color: "#60a5fa", bg: "rgba(37,99,235,0.15)" },
  moroso:    { label: "Moroso",    color: "#f87171", bg: "rgba(239,68,68,0.15)" },
  cancelado: { label: "Cancelado", color: "#94a3b8", bg: "rgba(255,255,255,0.05)" },
};

export function tipoBadge(tipo: string) {
  const map: Record<string, any> = {
    taller:    { background: "rgba(139,92,246,0.2)", color: "#a78bfa", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
    proveedor: { background: "rgba(37,99,235,0.2)",  color: "#60a5fa", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  };
  return map[tipo] || { background: "rgba(255,255,255,0.05)", color: "#94a3b8", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
}

export function subBadge(sub: string) {
  const s = SUSCRIPCION_LABELS[sub] || { bg: "rgba(255,255,255,0.05)", color: "#94a3b8" };
  return { background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
}

export function selectSub(sub: string) {
  const s = SUSCRIPCION_LABELS[sub] || { bg: "rgba(255,255,255,0.05)", color: "#94a3b8" };
  return { background: s.bg, color: s.color, border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 13, cursor: "pointer", outline: "none" };
}

// overflowX auto: si una tabla no cabe, se desplaza en horizontal en vez de cortarse
export const tableContainer = { background: "rgba(15,23,42,0.95)", borderRadius: 16, overflowX: "auto" as const, overflowY: "hidden" as const, border: "1px solid rgba(255,255,255,0.06)" };
export const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
export const thStyle = { padding: "11px 12px", textAlign: "left" as const, color: "#94a3b8", fontSize: 11, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", whiteSpace: "nowrap" as const };
export const trStyle = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
export const tdStyle = { padding: "10px 12px", fontSize: 13.5, verticalAlign: "middle" as const };
export const kpiCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, minWidth: 0 };
export const kpiLabel = { color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 10 };
export const kpiNum = { fontSize: 32, fontWeight: 900, margin: 0, lineHeight: 1.1 };
export const seccionCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 22, minWidth: 0 };
export const btnAccion = { background: "rgba(37,99,235,0.2)", color: "#60a5fa", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 };
export const btnExportar = { background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "14px 28px", borderRadius: 14, fontWeight: 900, cursor: "pointer", fontSize: 15 };
export const btnFiltro = { padding: "8px 16px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 13 };
export const btnPagina = { background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 };
export const btnVer = { background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 };
export const searchInput = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "white", fontSize: 14, outline: "none", minWidth: 280 };
export const titleStyle = { fontSize: 36, fontWeight: 900, lineHeight: 1, marginBottom: 12 };
export const descStyle = { color: "#94a3b8", fontSize: 18, marginBottom: 36 };
export const filtrosBox = { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" };
// Columna de acciones fija a la derecha: siempre visible aunque la tabla se desplace
export const stickyTh = { ...thStyle, position: "sticky" as const, right: 0, background: "#0b1220", boxShadow: "-8px 0 12px -8px rgba(0,0,0,0.6)", zIndex: 2 };
export const stickyTd = { ...tdStyle, position: "sticky" as const, right: 0, background: "#0f172a", boxShadow: "-8px 0 12px -8px rgba(0,0,0,0.6)", zIndex: 1 };
export const ESTADO_ENVIO: Record<string, { label: string; color: string }> = {
  pendiente:   { label: "⏳ Pendiente",   color: "#f59e0b" },
  preparando:  { label: "🔧 Preparando",  color: "#60a5fa" },
  recogido:    { label: "📦 Recogido",    color: "#38bdf8" },
  en_transito: { label: "🚚 En tránsito", color: "#a78bfa" },
  enviado:     { label: "🚚 Enviado",     color: "#a78bfa" },
  entregado:   { label: "✅ Entregado",   color: "#4ade80" },
  incidencia:  { label: "⚠️ Incidencia",  color: "#f87171" },
  anulado:     { label: "❌ Anulado",     color: "#f87171" },
};
