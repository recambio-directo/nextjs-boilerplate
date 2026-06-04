import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: "#0b1736" },
  logoText: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0b1736", letterSpacing: 1 },
  logoSub: { fontSize: 9, color: "#6b7280", marginTop: 3 },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0b1736" },
  docCodigo: { fontSize: 11, color: "#2563eb", marginTop: 4, fontFamily: "Helvetica-Bold" },
  docFecha: { fontSize: 9, color: "#6b7280", marginTop: 3 },
  avisoBox: { backgroundColor: "#eff6ff", borderLeftWidth: 3, borderLeftColor: "#2563eb", padding: 10, marginBottom: 20 },
  avisoText: { fontSize: 9, color: "#1e40af" },
  partesRow: { flexDirection: "row", marginBottom: 20, gap: 12 },
  parteBox: { flex: 1, borderWidth: 1.5, borderColor: "#0b1736", padding: 12 },
  parteLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", marginBottom: 6 },
  parteNombre: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0b1736", marginBottom: 4 },
  parteInfo: { fontSize: 9, color: "#374151", marginBottom: 2 },
  tableTitleBox: { backgroundColor: "#0b1736", padding: 10 },
  tableTitleText: { color: "#ffffff", fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "center" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", padding: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", padding: 8 },
  tableRowAlt: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", padding: 8, backgroundColor: "#f9fafb" },
  colUd:       { width: "7%",  fontSize: 9, color: "#6b7280", fontFamily: "Helvetica-Bold" },
  colRef:      { width: "20%", fontSize: 9, color: "#6b7280", fontFamily: "Helvetica-Bold" },
  colDesc:     { width: "43%", fontSize: 9, color: "#6b7280", fontFamily: "Helvetica-Bold" },
  colPrecio:   { width: "15%", fontSize: 9, color: "#6b7280", fontFamily: "Helvetica-Bold", textAlign: "right" },
  colNeto:     { width: "15%", fontSize: 9, color: "#6b7280", fontFamily: "Helvetica-Bold", textAlign: "right" },
  colUdVal:    { width: "7%",  fontSize: 9, color: "#1a1a1a" },
  colRefVal:   { width: "20%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0b1736" },
  colDescVal:  { width: "43%", fontSize: 9, color: "#374151" },
  colPrecioVal:{ width: "15%", fontSize: 9, color: "#374151", textAlign: "right" },
  colNetoVal:  { width: "15%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1a1a1a", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", padding: 7, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  totalLabel: { fontSize: 9, color: "#6b7280", marginRight: 40 },
  totalValue: { fontSize: 9, color: "#1a1a1a", width: 70, textAlign: "right" },
  totalFinalRow: { flexDirection: "row", justifyContent: "flex-end", padding: 9, backgroundColor: "#f9fafb" },
  totalFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0b1736", marginRight: 40 },
  totalFinalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0b1736", width: 70, textAlign: "right" },
  formaPagoBox: { borderWidth: 1, borderColor: "#e5e7eb", padding: 12, marginTop: 14, marginBottom: 14, flexDirection: "row", justifyContent: "space-between" },
  formaPagoLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0b1736" },
  formaPagoVal: { fontSize: 9, color: "#374151" },
  transporteBox: { borderWidth: 1, borderColor: "#e5e7eb", padding: 14, marginBottom: 14 },
  transporteTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0b1736", marginBottom: 8 },
  transporteRow: { fontSize: 9, color: "#374151", marginBottom: 4 },
  avisoFinalBox: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", padding: 12, marginTop: 10 },
  avisoFinalText: { fontSize: 9, color: "#166534" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

type Producto = {
  referencia: string;
  descripcion?: string;
  producto?: string;
  precio: number;
  impuesto?: number;
};

export type AlbaranProps = {
  codigo: string;
  fecha: string;
  proveedorNombre: string;
  proveedorEmail: string;
  proveedorCif?: string;
  proveedorTelefono?: string;
  proveedorDireccion?: string;
  cliente: string;
  clienteEmail: string;
  telefono: string;
  cif: string;
  direccion: string;
  agencia: string;
  formaPago?: string;
  productos: Producto[];
  subtotal: number;
  iva: number;
  total: number;
};

const FORMA_PAGO_LABELS: Record<string, string> = {
  rd_pago: "RD Pago (credito plataforma)",
  tarjeta: "Tarjeta bancaria",
  transferencia: "Transferencia bancaria",
};

export function AlbaranPDF({
  codigo, fecha, proveedorNombre, proveedorEmail, proveedorCif, proveedorTelefono, proveedorDireccion,
  cliente, clienteEmail, telefono, cif, direccion,
  agencia, formaPago, productos, subtotal, iva, total,
}: AlbaranProps) {
  const fechaFormateada = fecha
    ? new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
    : new Date().toLocaleDateString("es-ES");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>RECAMBIO DIRECTO</Text>
            <Text style={styles.logoSub}>Marketplace B2B de recambios de automociOn</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>ALBARAN DE PEDIDO</Text>
            <Text style={styles.docCodigo}>{codigo}</Text>
            <Text style={styles.docFecha}>{fechaFormateada}</Text>
          </View>
        </View>

        <View style={styles.avisoBox}>
          <Text style={styles.avisoText}>
            Pedido confirmado. El proveedor ha sido notificado y preparara tu pedido en la mayor brevedad posible.
          </Text>
        </View>

        <View style={styles.partesRow}>
          <View style={styles.parteBox}>
            <Text style={styles.parteLabel}>VENDEDOR</Text>
            <Text style={styles.parteNombre}>{proveedorNombre}</Text>
            {!!proveedorCif && <Text style={styles.parteInfo}>CIF: {proveedorCif.toUpperCase()}</Text>}
            {!!proveedorDireccion && <Text style={styles.parteInfo}>{proveedorDireccion}</Text>}
            {!!proveedorTelefono && <Text style={styles.parteInfo}>Tel: {proveedorTelefono}</Text>}
            <Text style={styles.parteInfo}>{proveedorEmail}</Text>
          </View>
          <View style={styles.parteBox}>
            <Text style={styles.parteLabel}>COMPRADOR</Text>
            <Text style={styles.parteNombre}>{cliente}</Text>
            {!!cif && <Text style={styles.parteInfo}>CIF: {cif}</Text>}
            {!!direccion && <Text style={styles.parteInfo}>{direccion}</Text>}
            {!!telefono && <Text style={styles.parteInfo}>Tel: {telefono}</Text>}
            {!!clienteEmail && <Text style={styles.parteInfo}>{clienteEmail}</Text>}
          </View>
        </View>

        <View style={styles.tableTitleBox}>
          <Text style={styles.tableTitleText}>DETALLE DEL PEDIDO — {codigo} — {fechaFormateada}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colUd}>Ud.</Text>
          <Text style={styles.colRef}>Referencia</Text>
          <Text style={styles.colDesc}>Descripcion</Text>
          <Text style={styles.colPrecio}>Precio ud.</Text>
          <Text style={styles.colNeto}>Neto</Text>
        </View>

        {productos.map((p, i) => {
          const precioTotal = Number(p.precio) + Number(p.impuesto || 0);
          return (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colUdVal}>1</Text>
              <Text style={styles.colRefVal}>{p.referencia}</Text>
              <Text style={styles.colDescVal}>
                {p.descripcion || p.producto || "-"}
                {p.impuesto && Number(p.impuesto) > 0 ? " (inc. ecotasa " + Number(p.impuesto).toFixed(2) + "EUR)" : ""}
              </Text>
              <Text style={styles.colPrecioVal}>{precioTotal.toFixed(2)} EUR</Text>
              <Text style={styles.colNetoVal}>{precioTotal.toFixed(2)} EUR</Text>
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal piezas</Text>
          <Text style={styles.totalValue}>{Number(subtotal).toFixed(2)} EUR</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA piezas (21%)</Text>
          <Text style={styles.totalValue}>{Number(iva).toFixed(2)} EUR</Text>
        </View>
        <View style={styles.totalFinalRow}>
          <Text style={styles.totalFinalLabel}>TOTAL PIEZAS</Text>
          <Text style={styles.totalFinalValue}>{Number(total).toFixed(2)} EUR</Text>
        </View>

        {/* PORTE — FACTURADO SEPARADAMENTE */}
        <View style={{ backgroundColor: "#fef3c7", borderWidth: 1, borderColor: "#f59e0b", padding: 10, marginTop: 8 }}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#92400e", marginBottom: 4 }}>
            GASTOS DE TRANSPORTE — Facturados independientemente
          </Text>
          <Text style={{ fontSize: 9, color: "#78350f" }}>
            Agencia: {agencia} — El coste del porte sera facturado por separado y no esta incluido en el importe de piezas indicado.
            El porte no es objeto de devolucion aunque se devuelva la mercancia.
          </Text>
        </View>

        <View style={styles.formaPagoBox}>
          <Text style={styles.formaPagoLabel}>Forma de pago:</Text>
          <Text style={styles.formaPagoVal}>{FORMA_PAGO_LABELS[formaPago || ""] || formaPago || "No especificada"}</Text>
          <Text style={styles.formaPagoLabel}>Transporte:</Text>
          <Text style={styles.formaPagoVal}>{agencia}</Text>
        </View>

        <View style={styles.avisoFinalBox}>
          <Text style={styles.avisoFinalText}>
            Este documento acredita la realizacion del pedido. El pago es gestionado por Recambio Directo.
            Recibiras actualizaciones del estado de tu pedido por email.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Recambio Directo — Marketplace B2B de recambios de automociOn</Text>
          <Text style={styles.footerText}>{codigo} — {fechaFormateada}</Text>
        </View>
      </Page>
    </Document>
  );
}


// ============================================================
// ETIQUETA DE ENVIO PARA EL PROVEEDOR
// ============================================================

const etiquetaStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a", backgroundColor: "#ffffff" },
  
  // CABECERA GESTORA
  headerGestor: { backgroundColor: "#0b1736", padding: "12 20", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerGestorText: { color: "#ffffff", fontSize: 14, fontFamily: "Helvetica-Bold" },
  headerGestorSub: { color: "#94a3af", fontSize: 8 },
  headerGestorRight: { alignItems: "flex-end" },
  
  // BLOQUES PRINCIPALES
  bloquesRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#0b1736" },
  bloque: { flex: 1, padding: "14 16", borderRightWidth: 1, borderRightColor: "#e5e7eb" },
  bloqueLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280", marginBottom: 6, textTransform: "uppercase" },
  bloqueNombre: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0b1736", marginBottom: 4 },
  bloqueInfo: { fontSize: 9, color: "#374151", marginBottom: 2 },
  bloqueTelefono: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#2563eb", marginTop: 4 },

  // DATOS ENVIO
  datosEnvio: { flexDirection: "row", backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  datoBox: { flex: 1, padding: "10 14", borderRightWidth: 1, borderRightColor: "#e5e7eb", alignItems: "center" },
  datoLabel: { fontSize: 7, color: "#6b7280", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  datoVal: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0b1736" },
  datoValSmall: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0b1736" },

  // AGENCIA
  agenciaBox: { backgroundColor: "#0b1736", padding: "10 20", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  agenciaLabel: { fontSize: 8, color: "#94a3af", marginBottom: 3 },
  agenciaNombre: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  agenciaServicio: { fontSize: 9, color: "#60a5fa" },
  agenciaRight: { alignItems: "flex-end" },
  
  // PEDIDO INFO
  pedidoBox: { padding: "12 20", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  pedidoRow: { flexDirection: "row", marginBottom: 4 },
  pedidoLabel: { fontSize: 9, color: "#6b7280", width: 100, fontFamily: "Helvetica-Bold" },
  pedidoVal: { fontSize: 9, color: "#1a1a1a", flex: 1 },
  pedidoCodigo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#2563eb", marginBottom: 8 },
  
  // REFERENCIAS
  refsBox: { padding: "10 20", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  refsTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", marginBottom: 6 },
  refRow: { flexDirection: "row", marginBottom: 3 },
  refCodigo: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0b1736", width: 120 },
  refDesc: { fontSize: 9, color: "#374151", flex: 1 },
  refCant: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0b1736", width: 30, textAlign: "right" },

  // COPIA REMITENTE
  separador: { backgroundColor: "#000000", padding: "6 20" },
  separadorText: { color: "#ffffff", fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  
  // ZONA CONDUCTOR
  conductorBox: { flexDirection: "row", padding: "10 20", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  conductorField: { flex: 1, marginRight: 20 },
  conductorLabel: { fontSize: 8, color: "#6b7280", fontFamily: "Helvetica-Bold", marginBottom: 16 },
  conductorLinea: { borderBottomWidth: 1, borderBottomColor: "#9ca3af" },
  
  // PORTES
  portesBox: { backgroundColor: "#fef3c7", padding: "8 20", flexDirection: "row", justifyContent: "space-between" },
  portesLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#92400e" },
  portesVal: { fontSize: 9, color: "#78350f" },

  footer: { backgroundColor: "#0b1736", padding: "8 20", flexDirection: "row", justifyContent: "space-between", position: "absolute", bottom: 0, left: 0, right: 0 },
  footerText: { fontSize: 8, color: "#94a3af" },
});

export type EtiquetaEnvioProps = {
  codigo: string;
  fecha: string;
  proveedorNombre: string;
  proveedorEmail: string;
  proveedorTelefono?: string;
  proveedorDireccion?: string;
  cliente: string;
  clienteEmail: string;
  telefono: string;
  cif: string;
  direccion: string;
  agencia: string;
  productos: { referencia: string; descripcion?: string; producto?: string; precio: number; impuesto?: number }[];
  subtotal: number;
  iva: number;
  total: number;
};

export function EtiquetaEnvioPDF({
  codigo, fecha, proveedorNombre, proveedorEmail, proveedorTelefono,
  proveedorDireccion, cliente, clienteEmail, telefono, cif,
  direccion, agencia, productos, total,
}: EtiquetaEnvioProps) {
  const fechaFormateada = fecha
    ? new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
    : new Date().toLocaleDateString("es-ES");

  const refResumen = productos.slice(0, 2).map(p => p.referencia).join(", ") + (productos.length > 2 ? ` (+${productos.length - 2})` : "");

  return (
    <Document>
      <Page size="A5" style={etiquetaStyles.page}>

        {/* CABECERA GESTORA */}
        <View style={etiquetaStyles.headerGestor}>
          <View>
            <Text style={etiquetaStyles.headerGestorText}>RECAMBIO DIRECTO</Text>
            <Text style={etiquetaStyles.headerGestorSub}>Marketplace B2B — Etiqueta de envio</Text>
          </View>
          <View style={etiquetaStyles.headerGestorRight}>
            <Text style={{ color: "#ffffff", fontSize: 9 }}>info@recambio-directo.com</Text>
            <Text style={{ color: "#60a5fa", fontSize: 9, marginTop: 2 }}>Pedido: {codigo}</Text>
            <Text style={{ color: "#94a3af", fontSize: 8, marginTop: 1 }}>{fechaFormateada}</Text>
          </View>
        </View>

        {/* REMITENTE Y DESTINATARIO */}
        <View style={etiquetaStyles.bloquesRow}>
          <View style={etiquetaStyles.bloque}>
            <Text style={etiquetaStyles.bloqueLabel}>REMITENTE</Text>
            <Text style={etiquetaStyles.bloqueNombre}>{proveedorNombre}</Text>
            {!!proveedorDireccion && <Text style={etiquetaStyles.bloqueInfo}>{proveedorDireccion}</Text>}
            {!!proveedorEmail && <Text style={etiquetaStyles.bloqueInfo}>{proveedorEmail}</Text>}
            {!!proveedorTelefono && <Text style={etiquetaStyles.bloqueTelefono}>Tlf: {proveedorTelefono}</Text>}
          </View>
          <View style={{ ...etiquetaStyles.bloque, borderRightWidth: 0 }}>
            <Text style={etiquetaStyles.bloqueLabel}>DESTINATARIO</Text>
            <Text style={etiquetaStyles.bloqueNombre}>{cliente}</Text>
            {!!direccion && <Text style={etiquetaStyles.bloqueInfo}>{direccion}</Text>}
            {!!clienteEmail && <Text style={etiquetaStyles.bloqueInfo}>{clienteEmail}</Text>}
            {!!telefono && <Text style={etiquetaStyles.bloqueTelefono}>Tlf: {telefono}</Text>}
          </View>
        </View>

        {/* DATOS ENVIO */}
        <View style={etiquetaStyles.datosEnvio}>
          <View style={etiquetaStyles.datoBox}>
            <Text style={etiquetaStyles.datoLabel}>BULTOS</Text>
            <Text style={etiquetaStyles.datoVal}>1</Text>
          </View>
          <View style={etiquetaStyles.datoBox}>
            <Text style={etiquetaStyles.datoLabel}>FECHA RECOGIDA</Text>
            <Text style={etiquetaStyles.datoValSmall}>{fechaFormateada}</Text>
          </View>
          <View style={{ ...etiquetaStyles.datoBox, borderRightWidth: 0 }}>
            <Text style={etiquetaStyles.datoLabel}>PORTES</Text>
            <Text style={etiquetaStyles.datoValSmall}>Pagados por RD</Text>
          </View>
        </View>

        {/* AGENCIA */}
        <View style={etiquetaStyles.agenciaBox}>
          <View>
            <Text style={etiquetaStyles.agenciaLabel}>COMPANIA DE TRANSPORTE</Text>
            <Text style={etiquetaStyles.agenciaNombre}>{agencia.toUpperCase()}</Text>
          </View>
          <View style={etiquetaStyles.agenciaRight}>
            <Text style={{ color: "#94a3af", fontSize: 7 }}>N Recogida</Text>
            <Text style={{ color: "#ffffff", fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 2 }}>________________</Text>
            <Text style={{ color: "#94a3af", fontSize: 7, marginTop: 4 }}>N Envio</Text>
            <Text style={{ color: "#ffffff", fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 2 }}>________________</Text>
          </View>
        </View>

        {/* DATOS PEDIDO */}
        <View style={etiquetaStyles.pedidoBox}>
          <Text style={etiquetaStyles.pedidoCodigo}>{codigo}</Text>
          <View style={etiquetaStyles.pedidoRow}>
            <Text style={etiquetaStyles.pedidoLabel}>Pedido:</Text>
            <Text style={etiquetaStyles.pedidoVal}>{codigo}</Text>
          </View>
          <View style={etiquetaStyles.pedidoRow}>
            <Text style={etiquetaStyles.pedidoLabel}>Referencias:</Text>
            <Text style={etiquetaStyles.pedidoVal}>{refResumen}</Text>
          </View>
          <View style={etiquetaStyles.pedidoRow}>
            <Text style={etiquetaStyles.pedidoLabel}>Importe:</Text>
            <Text style={etiquetaStyles.pedidoVal}>{Number(total).toFixed(2)} EUR (IVA incl.)</Text>
          </View>
          <View style={etiquetaStyles.pedidoRow}>
            <Text style={etiquetaStyles.pedidoLabel}>Gestionado por:</Text>
            <Text style={etiquetaStyles.pedidoVal}>Recambio Directo — info@recambio-directo.com</Text>
          </View>
        </View>

        {/* REFERENCIAS DETALLE */}
        <View style={etiquetaStyles.refsBox}>
          <Text style={etiquetaStyles.refsTitle}>REFERENCIAS A ENVIAR</Text>
          {productos.map((p, i) => (
            <View key={i} style={etiquetaStyles.refRow}>
              <Text style={etiquetaStyles.refCodigo}>{p.referencia}</Text>
              <Text style={etiquetaStyles.refDesc}>{p.descripcion || p.producto || "-"}</Text>
              <Text style={etiquetaStyles.refCant}>x1</Text>
            </View>
          ))}
        </View>

        {/* SEPARADOR COPIA REMITENTE */}
        <View style={etiquetaStyles.separador}>
          <Text style={etiquetaStyles.separadorText}>--- COPIA PARA EL REMITENTE ---</Text>
        </View>

        {/* ZONA CONDUCTOR */}
        <View style={etiquetaStyles.conductorBox}>
          <View style={etiquetaStyles.conductorField}>
            <Text style={etiquetaStyles.conductorLabel}>Hora de recogida</Text>
            <View style={etiquetaStyles.conductorLinea} />
          </View>
          <View style={etiquetaStyles.conductorField}>
            <Text style={etiquetaStyles.conductorLabel}>Nombre del conductor</Text>
            <View style={etiquetaStyles.conductorLinea} />
          </View>
          <View style={{ ...etiquetaStyles.conductorField, marginRight: 0 }}>
            <Text style={etiquetaStyles.conductorLabel}>Firma</Text>
            <View style={etiquetaStyles.conductorLinea} />
          </View>
        </View>

        {/* PORTES */}
        <View style={etiquetaStyles.portesBox}>
          <Text style={etiquetaStyles.portesLabel}>Portes a cargo de: Recambio Directo S.L.</Text>
          <Text style={etiquetaStyles.portesVal}>Metodo de pago: {codigo}</Text>
        </View>

      </Page>
    </Document>
  );
}