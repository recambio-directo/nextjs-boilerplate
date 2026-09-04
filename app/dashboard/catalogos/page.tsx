"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// ── TIPOS ──
interface Producto {
  ref: string;
  nombre: string;
  desc: string;
  destacado?: boolean; // true = disponible en España (tiene numerito en catálogo)
}

interface Seccion {
  titulo: string;
  icon: string;
  productos: Producto[];
}

interface Catalogo {
  slug: string;
  marca: string;
  descripcion: string;
  color: string;
  categoriaFiltro: string;
  pdfUrl: string;
  secciones: Seccion[];
}

// ── CATEGORÍAS GENERALES DEL MARKETPLACE ──
const CATEGORIAS_MARKETPLACE = [
  { id: "todos", nombre: "Todos", icon: "📋" },
  { id: "lubricantes", nombre: "Lubricantes y Químicos", icon: "🛢️" },
  { id: "mecanica", nombre: "Mecánica y Electricidad", icon: "🔧" },
  { id: "accesorios", nombre: "Accesorios", icon: "🎯" },
  { id: "carroceria", nombre: "Carrocería y Pintura", icon: "🎨" },
  { id: "neumaticos", nombre: "Neumáticos y Llantas", icon: "🔘" },
  { id: "taller", nombre: "Taller", icon: "🏭" },
];

// ── LOGOS REALES ──
function LiquiMolyLogo({ size = 80 }: { size?: number }) {
  return (
    <img
      src="/catalogos/liqui-moly-logo.png"
      alt="Liqui Moly"
      style={{ width: size, height: "auto", objectFit: "contain", borderRadius: "6px" }}
    />
  );
}

function AuxolLogo({ size = 80 }: { size?: number }) {
  return (
    <img
      src="/catalogos/auxol-logo.png"
      alt="Auxol"
      style={{ width: size, height: "auto", objectFit: "contain", borderRadius: "6px" }}
    />
  );
}

// ── CATÁLOGOS ──
const CATALOGOS: Catalogo[] = [
  {
    slug: "liqui-moly",
    marca: "Liqui Moly",
    descripcion: "Catálogo General 2026 — Aditivos, Aceites, Cuidado del vehículo, Reparación, Pro-Line, Vehículos industriales, Moto, Marina y Equipamiento",
    color: "#dc2626",
    categoriaFiltro: "lubricantes",
    pdfUrl: "/catalogos/liqui-moly-catalogo.pdf",
    secciones: [
      // ═══ ADITIVOS DE ACEITE ═══
      {
        titulo: "Aditivos de Aceite",
        icon: "🔧",
        productos: [
          { ref: "1001", nombre: "Hybrid Additive", desc: "Aditivo especial para vehículos híbridos", destacado: true },
          { ref: "3721", nombre: "Cera Tec", desc: "Tratamiento cerámico antidesgaste", destacado: true },
          { ref: "5200", nombre: "Oil Sludge Flush", desc: "Disuelve lodos del circuito de aceite" },
          { ref: "8364", nombre: "Aditivo de aceite MoS2 300ml", desc: "Aditivo con bisulfuro de molibdeno" },
          { ref: "2591", nombre: "Oil Additive MoS2 125ml", desc: "Aditivo MoS2 formato compacto" },
          { ref: "8359", nombre: "Sellador de fugas de aceite 300ml", desc: "Reduce consumo de aceite, renueva juntas" },
          { ref: "1802", nombre: "Motor Oil Saver 150ml", desc: "Reductor consumo aceite formato compacto" },
          { ref: "8374", nombre: "Engine Flush Plus", desc: "Limpieza interna rápida del motor" },
          { ref: "8367", nombre: "Hydraulic Lifter Additive 300ml", desc: "Elimina ruido de taqués hidráulicos" },
          { ref: "8362", nombre: "Viscoplus for Oil 300ml", desc: "Estabilizador de viscosidad" },
          { ref: "1015", nombre: "Molygen Motor Protect", desc: "Protección antidesgaste Molygen" },
          { ref: "8360", nombre: "Oil Smoke Stop 300ml", desc: "Reduce humo azul del escape" },
          { ref: "1018", nombre: "Motor Protect", desc: "Protección antidesgaste larga duración" },
          { ref: "1019", nombre: "Motor Clean", desc: "Limpiador interno previo cambio aceite" },
          { ref: "8387", nombre: "Aditivo para aceite del cambio", desc: "Protección para la transmisión" },
        ],
      },
      // ═══ ADITIVOS GASOLINA ═══
      {
        titulo: "Aditivos Gasolina",
        icon: "⛽",
        productos: [
          { ref: "8365", nombre: "Mantenimiento del sistema de gasolina 300ml", desc: "Limpieza y protección completa del sistema" },
          { ref: "5129", nombre: "Fuel System Cleaner", desc: "Limpiador del sistema de combustible gasolina" },
          { ref: "2180", nombre: "Injection Reiniger", desc: "Limpiador de inyectores gasolina" },
          { ref: "8858", nombre: "Octane Plus 200L", desc: "Elevador de octanaje" },
          { ref: "1280", nombre: "Octane Booster", desc: "Elevador de octanaje" },
          { ref: "8827", nombre: "Speed Tec Gasolina concentrado", desc: "Mejora la combustión gasolina" },
          { ref: "21644", nombre: "Speed Tec Gasolina 250ml", desc: "Mejora la combustión gasolina" },
          { ref: "21646", nombre: "Estabilizante para gasolina 250ml", desc: "Estabiliza gasolina almacenada" },
          { ref: "21321", nombre: "Aditivo para E10 150ml", desc: "Protección contra efectos del E10" },
        ],
      },
      // ═══ ADITIVOS DIÉSEL ═══
      {
        titulo: "Aditivos Diésel",
        icon: "🛢️",
        productos: [
          { ref: "8357", nombre: "Sistema mantenimiento Diesel 250ml", desc: "Mantenimiento integral sistema diésel" },
          { ref: "8366", nombre: "Aditivo super diésel 250ml", desc: "Aditivo multifuncional diésel", destacado: true },
          { ref: "8361", nombre: "Limpiador de inyección 300ml", desc: "Limpia sistema de inyección diésel" },
          { ref: "8363", nombre: "Stop hollín diesel 150ml", desc: "Reduce las emisiones de hollín" },
          { ref: "8380", nombre: "Limpiador de inyección Diesel 500ml", desc: "Limpiador inyección formato grande" },
          { ref: "21317", nombre: "Aditivo diésel anti-bacterias 1L", desc: "Biocida contra bacterias en depósito", destacado: true },
          { ref: "21318", nombre: "Aditivo diésel anti-bacterias 5L", desc: "Anti-bacterias formato profesional" },
          { ref: "20605", nombre: "Speed Tec Diésel concentrado", desc: "Mejora la combustión diésel" },
          { ref: "21645", nombre: "Speed Tec Diesel 250ml", desc: "Mejora la combustión diésel" },
          { ref: "20940", nombre: "Aditivo diésel anti-bacterias 125ml", desc: "Biocida formato compacto", destacado: true },
          { ref: "8372", nombre: "Sistema mantenimiento Diesel 250ml", desc: "Mantenimiento integral diésel" },
          { ref: "8386", nombre: "Sistema mantenimiento Diesel 250ml", desc: "Mantenimiento integral diésel" },
        ],
      },
      // ═══ SISTEMA DE REFRIGERACIÓN ═══
      {
        titulo: "Refrigeración y Radiador",
        icon: "❄️",
        productos: [
          { ref: "8369", nombre: "Limpiador para el radiador 300ml", desc: "Limpieza interna del sistema de refrigeración" },
          { ref: "8383", nombre: "Limpiador para el radiador 300ml", desc: "Limpiador radiador" },
          { ref: "8370", nombre: "Tapafugas de radiador 250ml", desc: "Sella fugas del circuito de refrigeración" },
          { ref: "8371", nombre: "Tapafugas de radiador 150ml", desc: "Tapafugas radiador formato compacto" },
          { ref: "8385", nombre: "Tapafugas de radiador 250ml", desc: "Tapafugas radiador" },
          { ref: "8373", nombre: "Limpiador para válvulas 150ml", desc: "Limpia válvulas del sistema refrigeración" },
          { ref: "20000", nombre: "Klima Refresh 75ml", desc: "Desinfectante para aire acondicionado", destacado: true },
          { ref: "9802", nombre: "Set limpiador sistema aire acondicionado", desc: "Kit completo limpieza A/C" },
          { ref: "21532", nombre: "Detergente para acondicionadores de aire 250ml", desc: "Limpiador evaporador A/C" },
        ],
      },
      // ═══ ACEITES DE MOTOR ═══
      {
        titulo: "Aceites de Motor",
        icon: "🛢️",
        productos: [
          { ref: "9047", nombre: "Molygen New Generation 5W-30 1L", desc: "Aceite sintético con protección Molygen", destacado: true },
          { ref: "9045", nombre: "Molygen New Generation 5W-30 205L", desc: "Aceite Molygen barril" },
          { ref: "9044", nombre: "Molygen New Generation 5W-30 60L", desc: "Aceite Molygen bidón" },
          { ref: "8422", nombre: "Molygen New Generation 10W-30 205L", desc: "Aceite Molygen 10W-30" },
          { ref: "8536", nombre: "Molygen New Generation 5W-40 5L", desc: "Aceite Molygen 5W-40" },
          { ref: "8576", nombre: "Molygen New Generation 5W-40 1L", desc: "Aceite Molygen 5W-40 1L" },
          { ref: "9500", nombre: "Leichtlauf 10W-40 1L", desc: "Aceite semisintético", destacado: true },
          { ref: "9501", nombre: "Leichtlauf 10W-40 4L", desc: "Aceite semisintético 4L" },
          { ref: "9502", nombre: "Leichtlauf 10W-40 5L", desc: "Aceite semisintético 5L" },
          { ref: "9503", nombre: "Super Leichtlauf 10W-40 1L", desc: "Aceite Super Leichtlauf" },
          { ref: "9508", nombre: "Special Tec 5W-30 1L", desc: "Aceite especial VW/Audi", destacado: true },
          { ref: "9509", nombre: "Special Tec 5W-30 5L", desc: "Aceite especial VW/Audi 5L" },
          { ref: "9510", nombre: "Top Tec 4100 5W-40 1L", desc: "Aceite para vehículos modernos", destacado: true },
          { ref: "9511", nombre: "Top Tec 4100 5W-40 5L", desc: "Aceite Top Tec 4100 5L" },
          { ref: "9514", nombre: "Synthoil Energy 0W-40 1L", desc: "Aceite 100% sintético", destacado: true },
          { ref: "9516", nombre: "Formula Super 15W-40 1L", desc: "Aceite mineral" },
          { ref: "8461", nombre: "Leichtlauf HC7 5W-30 4L", desc: "Aceite HC-sintético" },
          { ref: "8460", nombre: "Special Tec LR 5W-20 5L", desc: "Aceite especial Jaguar/Land Rover" },
          { ref: "8423", nombre: "Special Tec AA 10W-30 Diesel 5L", desc: "Aceite especial Asia/América" },
          { ref: "8902", nombre: "Special Tec F 0W-30 1L", desc: "Aceite especial Ford" },
          { ref: "20425", nombre: "Special Tec AA 5W-40 Diesel", desc: "Aceite especial diésel" },
          { ref: "8863", nombre: "Touring High Tech Super SHPD 15W-40 TBN20", desc: "Aceite vehículos industriales" },
          { ref: "8905", nombre: "Touring High Tech 15W-40 1L", desc: "Aceite turismo high tech" },
          { ref: "8908", nombre: "Synthoil Race Tech GT1 10W-60 1L", desc: "Aceite racing" },
        ],
      },
      // ═══ ACEITES DE TRANSMISIÓN ═══
      {
        titulo: "Aceites de Transmisión",
        icon: "⚙️",
        productos: [
          { ref: "9700", nombre: "Top Tec ATF 1100 G 1L", desc: "Aceite transmisión automática" },
          { ref: "9703", nombre: "Top Tec ATF 1200 G 1L", desc: "ATF para cajas ZF" },
          { ref: "9704", nombre: "Top Tec ATF 1800 1L", desc: "ATF BMW/Mini/Rolls-Royce" },
          { ref: "8505", nombre: "Aceite 100% sintético para el cambio GL5 SAE 75W-90 1L", desc: "Aceite cambio manual sintético" },
          { ref: "8954", nombre: "Aceite para el cambio GL4 85W-90 1L", desc: "Aceite cambio manual mineral" },
          { ref: "9521", nombre: "ATF III (amarillo) 1L", desc: "Aceite transmisión automática Dexron III" },
          { ref: "9524", nombre: "Aceite para el sistema hidráulico central 1L", desc: "Aceite hidráulico dirección" },
          { ref: "20842", nombre: "Top Tec MTF 5100 75W 1L", desc: "Aceite cambio manual moderno" },
          { ref: "20845", nombre: "Top Tec MTF 5200 75W-80 1L", desc: "Aceite cambio manual PSA/Renault" },
        ],
      },
      // ═══ ANTICONGELANTES ═══
      {
        titulo: "Anticongelantes",
        icon: "🧊",
        productos: [
          { ref: "8809", nombre: "Coolant & Antifreeze Ready Mix RAF 11 5L", desc: "Anticongelante listo para usar" },
          { ref: "8810", nombre: "Coolant & Antifreeze Ready Mix RAF 12+ 5L", desc: "Anticongelante RAF12+" },
          { ref: "21127", nombre: "Coolant & Antifreeze KFS 11 20L", desc: "Anticongelante concentrado KFS 11" },
          { ref: "21130", nombre: "Coolant & Antifreeze KFS 33 1L", desc: "Anticongelante KFS 33" },
          { ref: "21134", nombre: "Coolant & Antifreeze KFS 12++ 1L", desc: "Anticongelante KFS 12++" },
          { ref: "21145", nombre: "Coolant & Antifreeze KFS 12+ 1L", desc: "Anticongelante KFS 12+" },
          { ref: "21149", nombre: "Coolant & Antifreeze KFS 11 1L", desc: "Anticongelante KFS 11 1L" },
          { ref: "23152", nombre: "Coolant & Antifreeze KFS 18 1L", desc: "Anticongelante KFS 18" },
          { ref: "21304", nombre: "Coolant & Antifreeze KFS 12++ 200L", desc: "Anticongelante barril" },
          { ref: "20660", nombre: "Coolant & Antifreeze Ready Mix RAF 11 1L", desc: "Anticongelante listo 1L" },
          { ref: "23139", nombre: "Coolant & Antifreeze KFS P-OAT GE 1L", desc: "Anticongelante OAT" },
          { ref: "21740", nombre: "Coolant & Antifreeze KFS 12 Evo 1L", desc: "Anticongelante Evo" },
        ],
      },
      // ═══ LÍQUIDOS DE FRENOS ═══
      {
        titulo: "Líquidos de Frenos",
        icon: "🔴",
        productos: [
          { ref: "21155", nombre: "Líquido para frenos DOT 4 250ml", desc: "Líquido frenos DOT 4" },
          { ref: "21157", nombre: "Líquido para frenos DOT 4 1L", desc: "Líquido frenos DOT 4 1L" },
          { ref: "21160", nombre: "Líquido para frenos DOT 5.1 250ml", desc: "Líquido frenos DOT 5.1" },
          { ref: "21162", nombre: "Líquido para frenos DOT 5.1 1L", desc: "Líquido frenos DOT 5.1 1L" },
          { ref: "21166", nombre: "Líquido para frenos SL6 DOT 4 250ml", desc: "Líquido frenos SL6" },
          { ref: "21729", nombre: "Líquido de frenos DOT 5.1 EV 500ml", desc: "Líquido frenos eléctricos" },
        ],
      },
      // ═══ PRO-LINE (PROFESIONAL) ═══
      {
        titulo: "Pro-Line (Profesional)",
        icon: "🏭",
        productos: [
          { ref: "20450", nombre: "Pro-Line Limpiador del sistema diésel 500ml", desc: "Limpiador profesional diésel" },
          { ref: "20452", nombre: "Pro-Line JetClean Limpiador sistemas diésel 500ml", desc: "JetClean para máquinas profesionales" },
          { ref: "20453", nombre: "Pro-Line Limpiador del sistema de gasolina 500ml", desc: "Limpiador profesional gasolina" },
          { ref: "20454", nombre: "Aditivo lubricante diésel 150ml", desc: "Aditivo lubricante profesional" },
          { ref: "20455", nombre: "Pro-Line Limpiador para el radiador 1L", desc: "Limpiador radiador profesional" },
          { ref: "20456", nombre: "Limpiador para válvulas 150ml", desc: "Limpia válvulas profesional" },
          { ref: "20457", nombre: "Pro-Line Tapafugas de radiador K 250ml", desc: "Tapafugas profesional" },
          { ref: "20458", nombre: "Pro-Line Aditivo para filtros diésel 500ml", desc: "Aditivo DPF profesional" },
          { ref: "8986", nombre: "Pro-Line Limpiador válvulas de mariposa 400ml", desc: "Spray limpia válvula mariposa" },
          { ref: "9907", nombre: "Pro-Line Spray cerámica 400ml", desc: "Spray cerámico profesional" },
          { ref: "9913", nombre: "Pro-Line Spray electrónico 400ml", desc: "Limpiador contactos electrónicos" },
          { ref: "9914", nombre: "Pro-Line Spray blanco mantenimiento 400ml", desc: "Spray mantenimiento" },
          { ref: "9915", nombre: "Pro-Line Lubricante spray adherente 400ml", desc: "Lubricante adherente" },
          { ref: "9916", nombre: "Pro-Line Spray de silicona 400ml", desc: "Spray silicona profesional" },
          { ref: "9917", nombre: "Pro-Line Disolvente rápido de óxido 400ml", desc: "Desoxidante profesional" },
          { ref: "20913", nombre: "Pro-Line Limpiador filtro partículas diésel 1L", desc: "Limpiador DPF profesional" },
          { ref: "20914", nombre: "Pro-Line Solución enjuagado filtro partículas diésel 500ml", desc: "Enjuague DPF" },
          { ref: "21942", nombre: "Limpiador DPF/OPF 400ml", desc: "Limpiador filtro partículas spray" },
          { ref: "21976", nombre: "Pro-Line Aditivo ATF 250ml", desc: "Aditivo transmisión automática profesional", destacado: true },
          { ref: "21977", nombre: "Pro-Line Aditivo ATF 500ml", desc: "Aditivo ATF profesional 500ml" },
          { ref: "20962", nombre: "Pro-Line Super Diesel Additiv K 200L", desc: "Aditivo diésel profesional barril", destacado: true },
          { ref: "21281", nombre: "Pro-Line Limpiador inyección directa 120ml", desc: "Limpiador inyección directa" },
          { ref: "21284", nombre: "Protección para catalizadores 300ml", desc: "Protector catalizador" },
          { ref: "21386", nombre: "Pro-Line Limpiador universal vehículos industriales 10L", desc: "Limpiador industrial", destacado: true },
          { ref: "20630", nombre: "Sonda pulverizadora DPF larga 30cm", desc: "Accesorio limpieza DPF" },
          { ref: "21373", nombre: "Pro-Line Limpiador de inyección directa 120ml", desc: "Limpiador inyección directa" },
          { ref: "21374", nombre: "Pro-Line Limpiador de inyección directa 120ml", desc: "Limpiador inyección directa" },
        ],
      },
      // ═══ CUIDADO DEL VEHÍCULO ═══
      {
        titulo: "Cuidado del Vehículo",
        icon: "✨",
        productos: [
          { ref: "21634", nombre: "Limpiapantallas 100ml", desc: "Limpiador de pantallas táctiles" },
          { ref: "21341", nombre: "Liquimate 8400 Sellador carrocería blanco 310ml", desc: "Sellador carrocería" },
          { ref: "21345", nombre: "Pasta para montaje de neumáticos negra 5kg", desc: "Pasta montaje neumáticos", destacado: true },
          { ref: "21262", nombre: "Liquimate Pegamento instantáneo 2K 10g", desc: "Pegamento instantáneo", destacado: true },
          { ref: "23000", nombre: "Brillo para el cockpit 200ml", desc: "Brillo salpicadero" },
          { ref: "23001", nombre: "Espuma detergente para lunetas 300ml", desc: "Limpiador lunas" },
          { ref: "23002", nombre: "Crema de cuidado del cromo 250ml", desc: "Pulidor de cromados" },
          { ref: "23003", nombre: "Cuidado del plástico en profundidad 500ml", desc: "Restaurador plásticos" },
          { ref: "23005", nombre: "Cuidado de la goma 500ml", desc: "Protector de gomas" },
          { ref: "23007", nombre: "Limpiador y cera para automóviles 1L", desc: "Limpiador con cera" },
          { ref: "23008", nombre: "Quitainsectos 500ml", desc: "Limpiador de insectos" },
          { ref: "23009", nombre: "Detergente para automóviles 1L", desc: "Champú coche" },
          { ref: "23010", nombre: "Limpiador para el interior del automóvil 500ml", desc: "Limpiador interior" },
          { ref: "23025", nombre: "Limpiafácil 400ml", desc: "Limpiador multiusos" },
          { ref: "23014", nombre: "Fixklar Repelente de lluvia 100ml", desc: "Repelente de agua parabrisas" },
          { ref: "23011", nombre: "Gel para plástico como nuevo 250ml", desc: "Restaurador plásticos" },
          { ref: "23013", nombre: "Limpiador de silicona y cera 250ml", desc: "Desengrasante silicona" },
          { ref: "23015", nombre: "Limpiador de capotas 500ml", desc: "Limpiador capota descapotable" },
          { ref: "23020", nombre: "Agente eliminación de alquitrán 300ml", desc: "Quitaalquitrán" },
          { ref: "23021", nombre: "Espuma abrillantadora de neumáticos 400ml", desc: "Brillo neumáticos" },
          { ref: "23026", nombre: "Detailer cuidado rápido de la pintura 500ml", desc: "Detailer rápido" },
          { ref: "23027", nombre: "Pasta abrasiva 250ml", desc: "Pasta pulir" },
          { ref: "23028", nombre: "Quitarañazos 100ml", desc: "Elimina arañazos leves" },
          { ref: "23029", nombre: "Limpiador de pintura 500ml", desc: "Limpiador pintura" },
          { ref: "23030", nombre: "Producto de pulido y encerado 500ml", desc: "Pulimento y cera" },
          { ref: "23031", nombre: "Producto de pulido de alto brillo 500ml", desc: "Pulimento alto brillo" },
          { ref: "23032", nombre: "Cera dura y protectora 500ml", desc: "Cera protectora" },
          { ref: "23017", nombre: "Limpiador de llantas especial 1L", desc: "Limpiador llantas", destacado: true },
          { ref: "21525", nombre: "Limpiador rápido (spray) 500ml", desc: "Limpiador rápido" },
          { ref: "8916", nombre: "Spray de frío 400ml", desc: "Spray frío diagnóstico" },
          { ref: "8946", nombre: "LM 40 Spray multifuncional 200ml", desc: "Spray multiuso", destacado: true },
          { ref: "21180", nombre: "Multi-Spray Plus 7 500ml", desc: "Spray 7 funciones" },
          { ref: "23146", nombre: "LM 203 Barniz lubricante de MoS2 300ml", desc: "Barniz lubricante" },
          { ref: "8918", nombre: "Grasa universal blanca 400g", desc: "Grasa multiusos" },
          { ref: "21262", nombre: "Liquimate Pegamento instantáneo 2K", desc: "Pegamento bicomponente rápido", destacado: true },
          { ref: "8929", nombre: "Fluidificante diésel 150ml", desc: "Anticongelante diésel", destacado: true },
          { ref: "8931", nombre: "Catalytic-System Cleaner 300ml", desc: "Limpiador sistema catalítico", destacado: true },
        ],
      },
      // ═══ VEHÍCULOS INDUSTRIALES ═══
      {
        titulo: "Vehículos Industriales / Truck",
        icon: "🚛",
        productos: [
          { ref: "20995", nombre: "Truck Series Complete Fuel System Cleaner 500ml", desc: "Limpiador sistema combustible camión" },
          { ref: "20996", nombre: "Truck Series Complete Diesel System Cleaner 500ml", desc: "Limpiador diésel camión" },
          { ref: "20997", nombre: "Truck Series Diesel Performance and Protectant 500ml", desc: "Rendimiento diésel camión" },
          { ref: "20998", nombre: "Truck Series Oil Treatment 500ml", desc: "Tratamiento aceite camión" },
          { ref: "20999", nombre: "Truck Series DPF Protector 500ml", desc: "Protector DPF camión" },
          { ref: "20734", nombre: "Top Tec Truck 4350 5W-30 1000L", desc: "Aceite camión" },
          { ref: "21221", nombre: "Truck Top-up Oil 10W-30 5L", desc: "Aceite relleno camión" },
          { ref: "21263", nombre: "Top Tec Truck 4650 10W-30 20L", desc: "Aceite camión Euro 6" },
          { ref: "21907", nombre: "Top Tec Truck 6150 5W-30 205L", desc: "Aceite camión barril" },
        ],
      },
      // ═══ MOTO ═══
      {
        titulo: "Moto",
        icon: "🏍️",
        productos: [
          { ref: "20561", nombre: "Motorbike MoS2 Shooter 20ml", desc: "Aditivo moto MoS2", destacado: true },
          { ref: "20562", nombre: "Motorbike Engine Flush Shooter 80ml", desc: "Limpiador motor moto", destacado: true },
          { ref: "20585", nombre: "Motorbike Speed Shooter 80ml", desc: "Mejora rendimiento moto" },
          { ref: "20587", nombre: "Motorbike 4T Shooter 80ml", desc: "Aditivo 4T moto" },
          { ref: "20602", nombre: "Bike Limpiador de frenos y cadenas 200ml", desc: "Limpiador frenos bici/moto" },
          { ref: "20604", nombre: "Bike Spray lubricante para cadenas 200ml", desc: "Lubricante cadena" },
          { ref: "21714", nombre: "Motorbike Spray para cadenas 400ml", desc: "Spray cadena moto" },
          { ref: "21680", nombre: "Motorbike Detailer 500ml", desc: "Detailer moto" },
          { ref: "21668", nombre: "Motorbike Oil Additive 125ml", desc: "Aditivo aceite moto" },
          { ref: "8770", nombre: "Catálogo Motorbike", desc: "Catálogo completo moto" },
          { ref: "21774", nombre: "Bike Spray cerámico para cadenas 200ml", desc: "Lubricante cerámico cadena" },
          { ref: "21775", nombre: "Bike Reparapinchazos de neumáticos 75ml", desc: "Reparapinchazos bici" },
          { ref: "21777", nombre: "Bike Limpiador de frenos y cadenas 400ml", desc: "Limpiador frenos/cadenas 400ml" },
          { ref: "21778", nombre: "Bike Cleaner 1L", desc: "Limpiador bicicleta" },
          { ref: "21779", nombre: "Bike Lubricante para cadenas Wet Lube 100ml", desc: "Lubricante wet" },
          { ref: "21780", nombre: "Bike Lubricante para cadenas Dry Lube 100ml", desc: "Lubricante dry" },
        ],
      },
      // ═══ MARINA ═══
      {
        titulo: "Marina",
        icon: "⛵",
        productos: [
          { ref: "25000", nombre: "Marine Protección del sistema diésel 500ml", desc: "Protección sistema diésel marino" },
          { ref: "25004", nombre: "Marine Aditivo super diésel 500ml", desc: "Aditivo diésel marino" },
          { ref: "25008", nombre: "Marine Estabilizante para gasolina 500ml", desc: "Estabilizante gasolina marina" },
          { ref: "25010", nombre: "Marine Limpiador del sistema de gasolina 500ml", desc: "Limpiador gasolina marino" },
          { ref: "25012", nombre: "Marine 4T Motor Oil 10W-40 1L", desc: "Aceite motor fueraborda 4T" },
          { ref: "25030", nombre: "Marine Aceite del cambio GL4/GL5 80W-90 250ml", desc: "Aceite cambio marina" },
          { ref: "25041", nombre: "Marine Grasa 250g", desc: "Grasa marina" },
          { ref: "25047", nombre: "Marine Antical 5L", desc: "Antical marina" },
          { ref: "25051", nombre: "Marine Spray multifuncional 400ml", desc: "Spray multiusos marina" },
          { ref: "25063", nombre: "Marine 2T DFI Motor Oil 5L", desc: "Aceite 2T inyección marina" },
          { ref: "25072", nombre: "Marine Detergente universal K 1L", desc: "Detergente marina" },
        ],
      },
      // ═══ GUNTEC ═══
      {
        titulo: "GUNTEC (Armas)",
        icon: "🎯",
        productos: [
          { ref: "24391", nombre: "GUNTEC Aceite para armas 100ml", desc: "Aceite armas" },
          { ref: "24392", nombre: "GUNTEC Grasa para armas 50ml", desc: "Grasa armas" },
          { ref: "24394", nombre: "GUNTEC Limpiador de cañones y armas 200ml", desc: "Limpiador cañones" },
          { ref: "24395", nombre: "GUNTEC Limpiador de silenciadores 500ml", desc: "Limpiador silenciadores armas" },
        ],
      },
      // ═══ CAMPING ═══
      {
        titulo: "Camping",
        icon: "⛺",
        productos: [
          { ref: "21808", nombre: "Camping Spray lubricante protector 200ml", desc: "Spray protector camping" },
          { ref: "21809", nombre: "Camping Limpiador y cera 1L", desc: "Limpiador con cera autocaravana" },
          { ref: "21810", nombre: "Camping Cuidado del plástico 250ml", desc: "Cuidado plásticos camping" },
          { ref: "21811", nombre: "Camping Cuidado rápido de la pintura 500ml", desc: "Detailer autocaravana" },
          { ref: "21812", nombre: "Camping Multilimpiador de espuma 300ml", desc: "Espuma limpiadora" },
          { ref: "21813", nombre: "Camping Multispray 200ml", desc: "Multispray camping" },
          { ref: "21814", nombre: "Camping Top-up Oil 5W-30 1L", desc: "Aceite relleno autocaravana" },
          { ref: "21815", nombre: "Camping Impregnación tiendas campaña y toldo 500ml", desc: "Impermeabilizante" },
        ],
      },
    ],
  },
  // ════════════════════════════════════════════════
  // AUXOL 2025
  // ════════════════════════════════════════════════
  {
    slug: "auxol",
    marca: "Auxol",
    descripcion: "Catálogo Profesional 2025 — Tratamientos Diésel, Gasolina, DPF, Motor, Transmisión, Refrigeración, Climatización, Aerosoles y más",
    color: "#CD7F32",
    categoriaFiltro: "lubricantes",
    pdfUrl: "/catalogos/auxol-catalogo.pdf",
    secciones: [
      // ═══ SERVICIO DIÉSEL ═══
      {
        titulo: "Servicio Diésel",
        icon: "🛢️",
        productos: [
          { ref: "00361", nombre: "Detox Ultra Diesel Plus", desc: "Tratamiento detox ultra para diésel", destacado: true },
          { ref: "02845", nombre: "Limpia Inyección Diesel Plus", desc: "Limpiador avanzado de inyección diésel", destacado: true },
          { ref: "00445", nombre: "Limpia Inyectores Diesel", desc: "Limpiador de inyectores diésel", destacado: true },
          { ref: "00620", nombre: "Antihumo ITV Diesel", desc: "Reduce emisiones para pasar la ITV", destacado: true },
          { ref: "01445", nombre: "Antihumo ITV Diesel Plus", desc: "Antihumo diésel versión plus", destacado: true },
          { ref: "00110", nombre: "Tratamiento Circuito Diesel 1L", desc: "Limpieza permanente sistema inyección", destacado: true },
          { ref: "00125", nombre: "Tratamiento Circuito Diesel 5L", desc: "Tratamiento circuito diésel profesional" },
          { ref: "02920", nombre: "Restaura Juntas Inyección", desc: "Restaurador de juntas de inyección", destacado: true },
          { ref: "90145", nombre: "Kit ITV Diesel", desc: "Kit completo para pasar la ITV diésel", destacado: true },
          { ref: "00161", nombre: "Tratamiento Circuito Diesel 1L (V.I.)", desc: "Tratamiento circuito diésel vehículo industrial" },
          { ref: "00462", nombre: "Limpia Inyectores Diesel 2L", desc: "Limpia inyectores formato industrial" },
          { ref: "23961", nombre: "Anticongelante Diesel 1L", desc: "Anticongelante para gasóleo" },
        ],
      },
      // ═══ SERVICIO GASOLINA ═══
      {
        titulo: "Servicio Gasolina",
        icon: "⛽",
        productos: [
          { ref: "00861", nombre: "Detox Ultra Gasolina Plus", desc: "Tratamiento detox ultra para gasolina", destacado: true },
          { ref: "00545", nombre: "Limpia Inyectores Gasolina", desc: "Limpiador de inyectores gasolina", destacado: true },
          { ref: "03545", nombre: "Limpia Circuito Híbridos", desc: "Limpiador específico para motores híbridos", destacado: true },
          { ref: "00210", nombre: "Tratamiento Circuito Gasolina", desc: "Tratamiento completo circuito gasolina", destacado: true },
          { ref: "00720", nombre: "Antihumo ITV Gasolina", desc: "Reduce emisiones gasolina para ITV", destacado: true },
          { ref: "90245", nombre: "Kit ITV Gasolina", desc: "Kit completo para pasar la ITV gasolina", destacado: true },
        ],
      },
      // ═══ SERVICIO ADMISIÓN & POSTCOMBUSTIÓN ═══
      {
        titulo: "Admisión y Postcombustión",
        icon: "💨",
        productos: [
          { ref: "01940", nombre: "Limpia Turbo EGR", desc: "Limpiador de turbo y válvula EGR sin desmontaje", destacado: true },
          { ref: "90380", nombre: "Kit Limpieza Turbo-EGR", desc: "Kit profesional limpieza turbo y EGR", destacado: true },
          { ref: "04840", nombre: "Limpia Catalizador y Sensor Oxígeno", desc: "Limpiador catalizador y sonda lambda", destacado: true },
          { ref: "06461", nombre: "Tratamiento Urea 2 en 1 1000ml", desc: "Tratamiento urea AdBlue", destacado: true },
          { ref: "07040", nombre: "Limpia Inyector Urea & Filtro SCR", desc: "Limpiador inyector AdBlue y filtro SCR", destacado: true },
        ],
      },
      // ═══ SERVICIO DPF-FAP ═══
      {
        titulo: "Servicio DPF-FAP",
        icon: "🔥",
        productos: [
          { ref: "01061", nombre: "Detox DPF Plus", desc: "Tratamiento detox avanzado para DPF", destacado: true },
          { ref: "05750", nombre: "Limpia Catalizador & DPF", desc: "Limpiador combinado catalizador y DPF", destacado: true },
          { ref: "02761", nombre: "Limpiador DPF-GPF Pistola 1L", desc: "Limpiador DPF para pistola vaporizadora", destacado: true },
          { ref: "02765", nombre: "Limpiador DPF-GPF Pistola 5L", desc: "Limpiador DPF pistola formato profesional" },
          { ref: "00350", nombre: "Pistola Vaporizadora DPF-GPF", desc: "Pistola para limpieza DPF", destacado: true },
          { ref: "23630", nombre: "Activador DPF", desc: "Activa la regeneración del DPF", destacado: true },
          { ref: "07261", nombre: "Regenerador FAP Universal 1L", desc: "Regenerador de filtro de partículas", destacado: true },
          { ref: "07265", nombre: "Regenerador FAP Universal 5L", desc: "Regenerador FAP profesional" },
          { ref: "00355", nombre: "Kit llenado Regenerador FAP", desc: "Kit para llenado regenerador FAP" },
        ],
      },
      // ═══ SERVICIO DESCARBONIZACIÓN ═══
      {
        titulo: "Descarbonización",
        icon: "🧹",
        productos: [
          { ref: "05961", nombre: "Gel Carbon Cleaner", desc: "Gel limpiador de carbonilla", destacado: true },
          { ref: "22740", nombre: "Carbon Off Turbo EGR & Colectores", desc: "Elimina carbonilla de turbo, EGR y colectores", destacado: true },
          { ref: "05240", nombre: "Limpia Alquitrán + Inyectores", desc: "Limpiador de alquitrán e inyectores", destacado: true },
          { ref: "90680", nombre: "Kit Limpieza Cámara Combustión", desc: "Kit profesional descarbonización", destacado: true },
          { ref: "00357", nombre: "Kit Extracción de Fluidos", desc: "Kit para extracción de fluidos" },
        ],
      },
      // ═══ SERVICIO MOTOR ═══
      {
        titulo: "Servicio Motor",
        icon: "🔧",
        productos: [
          { ref: "21330", nombre: "Biowax Antifricción Motor", desc: "Antifricción con nanotecnología para motor", destacado: true },
          { ref: "21525", nombre: "Compresión Motor Antihumo Aceite", desc: "Mejora la compresión, reduce humo de aceite", destacado: true },
          { ref: "11245", nombre: "Limpia Carter-Taques", desc: "Limpiador de cárter y taqués", destacado: true },
          { ref: "21830", nombre: "Empujadores Hidráulicos", desc: "Elimina ruido de empujadores hidráulicos", destacado: true },
          { ref: "21710", nombre: "Stop Fugas Juntas & Retenes", desc: "Sella fugas de juntas y retenes", destacado: true },
          { ref: "11262", nombre: "Limpia Carter - Taques 2L (V.I.)", desc: "Limpiador cárter formato industrial" },
          { ref: "21361", nombre: "Biosyntec Antifricción Universal", desc: "Antifricción universal motor/cambio/dirección" },
          { ref: "21755", nombre: "Stop Fugas Juntas & Retenes 1L (V.I.)", desc: "Stop fugas formato industrial" },
        ],
      },
      // ═══ SERVICIO TRANSMISIÓN ═══
      {
        titulo: "Servicio Transmisión",
        icon: "⚙️",
        productos: [
          { ref: "21630", nombre: "Biowax Antifricción Cambio Automático", desc: "Antifricción para transmisión automática", destacado: true },
          { ref: "05330", nombre: "Limpiador Cambio Automático", desc: "Limpiador interno cambio automático", destacado: true },
          { ref: "21423", nombre: "Biowax Antifricción Cambio Manual", desc: "Antifricción para cambio manual", destacado: true },
          { ref: "24012", nombre: "Stop Fugas Servodirección", desc: "Sella fugas del sistema de servodirección", destacado: true },
        ],
      },
      // ═══ SERVICIO REFRIGERACIÓN ═══
      {
        titulo: "Servicio Refrigeración",
        icon: "❄️",
        productos: [
          { ref: "22230", nombre: "Limpia Radiador Instant", desc: "Limpieza rápida del radiador", destacado: true },
          { ref: "11850", nombre: "Desengrasa Radiadores", desc: "Desengrasante para radiadores", destacado: true },
          { ref: "22125", nombre: "Tapafugas Radiador", desc: "Sella fugas del circuito de refrigeración", destacado: true },
          { ref: "22261", nombre: "Limpia Radiador Instant 1L (V.I.)", desc: "Limpiador radiador formato industrial" },
          { ref: "11862", nombre: "Desengrasa Radiadores 2L (V.I.)", desc: "Desengrasante radiador formato industrial" },
          { ref: "22361", nombre: "Sellador Bloque Radiador 1L (V.I.)", desc: "Sellador bloque radiador industrial" },
        ],
      },
      // ═══ BLOQUE & JUNTA CULATA ═══
      {
        titulo: "Bloque y Junta Culata",
        icon: "🔩",
        productos: [
          { ref: "22323", nombre: "Sellador Bloque Radiador", desc: "Sella juntas de culata porosas y micro-fisuras", destacado: true },
          { ref: "06530", nombre: "Sellador Bloque Radiador Plus", desc: "Sellador bloque versión plus", destacado: true },
          { ref: "90480", nombre: "Kit Reparación Junta Culata", desc: "Kit profesional reparación junta culata", destacado: true },
        ],
      },
      // ═══ SERVICIO CLIMATIZACIÓN ═══
      {
        titulo: "Climatización",
        icon: "🌡️",
        productos: [
          { ref: "23320", nombre: "Higienizante Aire Acondicionado 200ml", desc: "Desinfectante circuito A/C", destacado: true },
          { ref: "24120", nombre: "Higienizante Habitáculo 200ml", desc: "Higieniza y ambientar habitáculo", destacado: true },
          { ref: "23404", nombre: "Tapafugas AC 30ml", desc: "Sella fugas de gas refrigerante A/C", destacado: true },
          { ref: "07904", nombre: "Tapafugas AC Plus 40ml", desc: "Tapafugas A/C con tecnología XCOOL", destacado: true },
          { ref: "00356", nombre: "Kit Conexión AC", desc: "Kit de conexión para aire acondicionado" },
        ],
      },
      // ═══ SERVICIO DEPÓSITOS ═══
      {
        titulo: "Servicio Depósitos",
        icon: "🏗️",
        productos: [
          { ref: "05062", nombre: "Aditech Diesel 2L", desc: "Descontaminante nanotecnológico diésel premium", destacado: true },
          { ref: "05065", nombre: "Aditech Diesel 5L", desc: "Aditech Diesel formato profesional" },
          { ref: "21130", nombre: "Tratamiento Bactericida Gasoleo 250ml", desc: "Biocida contra bacterias en depósitos", destacado: true },
          { ref: "21165", nombre: "Tratamiento Bactericida Gasoleo 5L", desc: "Bactericida formato profesional" },
          { ref: "06461", nombre: "Tratamiento Urea 2 en 1 1000ml", desc: "Protege inyector y filtro AdBlue", destacado: true },
        ],
      },
      // ═══ SERVICIO DETOX ═══
      {
        titulo: "Servicio Detox",
        icon: "🧪",
        productos: [
          { ref: "01760", nombre: "Detox Diesel Pro", desc: "Tratamiento detox profesional diésel", destacado: true },
          { ref: "01860", nombre: "Detox Gasolina Pro", desc: "Tratamiento detox profesional gasolina", destacado: true },
          { ref: "01960", nombre: "Detox Admisión Pro", desc: "Tratamiento detox profesional admisión", destacado: true },
          { ref: "03660", nombre: "Detox DPF Pro", desc: "Tratamiento detox profesional DPF", destacado: true },
          { ref: "00500", nombre: "Motor Detox 500", desc: "Máquina profesional tratamiento detox" },
        ],
      },
      // ═══ USUARIO FINAL ═══
      {
        titulo: "Servicio Usuario Final",
        icon: "🚗",
        productos: [
          { ref: "06025", nombre: "Menos Consumo Diesel", desc: "Reduce consumo de gasoil", destacado: true },
          { ref: "06125", nombre: "Menos Consumo Gasolina", desc: "Reduce consumo de gasolina", destacado: true },
          { ref: "06425", nombre: "Tratamiento Urea 2 en 1", desc: "Tratamiento urea para usuario final", destacado: true },
          { ref: "06225", nombre: "Protección Motor 4 en 1", desc: "Protección integral del motor", destacado: true },
          { ref: "90563", nombre: "Expositor Multiproductos", desc: "Expositor para punto de venta" },
        ],
      },
      // ═══ AEROSOLES - LIMPIEZA ═══
      {
        titulo: "Aerosoles - Limpieza",
        icon: "🧴",
        productos: [
          { ref: "23160", nombre: "Limpia Frenos 600ml", desc: "Limpiador de frenos aerosol", destacado: true },
          { ref: "23250", nombre: "Limpia Contactos 500ml", desc: "Limpiador de contactos eléctricos", destacado: true },
          { ref: "22740", nombre: "Carbon Off Turbo EGR & Colectores 400ml", desc: "Elimina carbonilla piezas desmontadas", destacado: true },
        ],
      },
      // ═══ AEROSOLES - LUBRICACIÓN ═══
      {
        titulo: "Aerosoles - Lubricación",
        icon: "⚡",
        productos: [
          { ref: "22440", nombre: "Aflojatodo Universal 400ml", desc: "Desbloquea piezas oxidadas y agarrotadas", destacado: true },
          { ref: "22540", nombre: "Lubricante Multiusos Plus 400ml", desc: "Lubricante 7 funciones", destacado: true },
          { ref: "23040", nombre: "Multigrease Partículas PTFE 400ml", desc: "Grasa con PTFE alta temperatura", destacado: true },
          { ref: "22640", nombre: "Multilube Dispersión PTFE 400ml", desc: "Lubricante PTFE penetrante", destacado: true },
        ],
      },
      // ═══ AEROSOLES - HERRAMIENTAS ═══
      {
        titulo: "Aerosoles - Herramientas",
        icon: "🔨",
        productos: [
          { ref: "04740", nombre: "Autoarranque Diesel Gasolina 400ml", desc: "Spray arranque en frío", destacado: true },
          { ref: "23520", nombre: "Silicona 100% RTV Negra 200ml", desc: "Sellante silicona resistente", destacado: true },
          { ref: "04340", nombre: "Desbloqueador Efecto Frío + PTFE 400ml", desc: "Desbloqueador con enfriamiento extremo", destacado: true },
          { ref: "05240", nombre: "Limpia Alquitrán + Inyectores 400ml", desc: "Elimina alquitrán solidificado", destacado: true },
        ],
      },
      // ═══ AEROSOLES - POSTCOMBUSTIÓN ═══
      {
        titulo: "Aerosoles - Postcombustión",
        icon: "🔥",
        productos: [
          { ref: "01940", nombre: "Limpia Turbo EGR 400ml", desc: "Limpiador turbo y EGR sin desmontaje", destacado: true },
          { ref: "05750", nombre: "Limpia Catalizador & DPF 500ml", desc: "Limpiador catalizador y DPF sin desmontaje", destacado: true },
          { ref: "07040", nombre: "Limpia Inyector Urea & Filtro SCR 400ml", desc: "Limpiador inyector AdBlue", destacado: true },
        ],
      },
    ],
  },
];

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════
export default function CatalogosPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState<Catalogo | null>(null);
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>(null);
  const [verPDF, setVerPDF] = useState(false);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [soloDestacados, setSoloDestacados] = useState(false);

  // Filtrar catálogos en la vista marketplace
  const catalogosFiltrados = useMemo(() => {
    return CATALOGOS.filter((c) => {
      if (categoriaActiva !== "todos" && c.categoriaFiltro !== categoriaActiva) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        return c.marca.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categoriaActiva, busqueda]);

  // Filtrar productos dentro de un catálogo
  const seccionesFiltradas = useMemo(() => {
    if (!catalogoSeleccionado) return [];
    return catalogoSeleccionado.secciones
      .map((sec) => {
        let prods = sec.productos;
        if (soloDestacados) prods = prods.filter((p) => p.destacado);
        if (busquedaCatalogo) {
          const q = busquedaCatalogo.toLowerCase();
          prods = prods.filter(
            (p) =>
              p.ref.toLowerCase().includes(q) ||
              p.nombre.toLowerCase().includes(q) ||
              p.desc.toLowerCase().includes(q)
          );
        }
        return { ...sec, productos: prods };
      })
      .filter((sec) => sec.productos.length > 0);
  }, [catalogoSeleccionado, busquedaCatalogo, soloDestacados]);

  const totalProductos = seccionesFiltradas.reduce((acc, s) => acc + s.productos.length, 0);

  // ═══════════════════════════════════════
  // VISTA DETALLE DE CATÁLOGO
  // ═══════════════════════════════════════
  if (catalogoSeleccionado) {
    return (
      <div style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>


        {/* Cabecera */}
        <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "20px 24px" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <button
              onClick={() => { setCatalogoSeleccionado(null); setVerPDF(false); setBusquedaCatalogo(""); setSoloDestacados(false); }}
              style={{
                background: "none", border: "1px solid #334155", color: "#94a3b8",
                padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                fontSize: "14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              ← Volver a catálogos
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ flexShrink: 0 }}>
                {catalogoSeleccionado.slug === "liqui-moly" ? <LiquiMolyLogo size={100} /> : <AuxolLogo size={100} />}
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
                  {catalogoSeleccionado.marca}
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "4px" }}>
                  {catalogoSeleccionado.descripcion}
                </p>
              </div>
            </div>

            {/* Controles */}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Buscar referencia o producto..."
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                style={{
                  flex: 1, minWidth: "200px", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #334155", background: "#1e293b", color: "#f8fafc",
                  fontSize: "14px", outline: "none",
                }}
              />
              <button
                onClick={() => setSoloDestacados(!soloDestacados)}
                style={{
                  padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  border: soloDestacados ? "1px solid #16a34a" : "1px solid #334155",
                  background: soloDestacados ? "rgba(22,163,106,0.15)" : "#1e293b",
                  color: soloDestacados ? "#4ade80" : "#94a3b8",
                }}
              >
                ⭐ Destacados España
              </button>
              <button
                onClick={() => setVerPDF(!verPDF)}
                style={{
                  padding: "10px 16px", borderRadius: "8px", border: "1px solid #334155",
                  background: verPDF ? "rgba(37,99,235,0.15)" : "#1e293b",
                  color: verPDF ? "#60a5fa" : "#94a3b8",
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                }}
              >
                📄 {verPDF ? "Ocultar PDF" : "Ver PDF"}
              </button>
              <a
                href={catalogoSeleccionado.pdfUrl}
                download
                style={{
                  padding: "10px 16px", borderRadius: "8px", border: "1px solid #334155",
                  background: "#1e293b", color: "#94a3b8", textDecoration: "none",
                  fontSize: "13px", fontWeight: 600,
                }}
              >
                ⬇️ Descargar PDF
              </a>
            </div>

            <div style={{ marginTop: "10px", color: "#64748b", fontSize: "13px" }}>
              {totalProductos} producto{totalProductos !== 1 ? "s" : ""} encontrado{totalProductos !== 1 ? "s" : ""}
              {soloDestacados && " (solo destacados España)"}
            </div>
          </div>
        </div>

        {/* PDF embed */}
        {verPDF && (
          <div style={{ maxWidth: "1400px", margin: "20px auto", padding: "0 24px" }}>
            <div style={{ background: "#0f172a", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e293b" }}>
              <iframe
                src={catalogoSeleccionado.pdfUrl}
                style={{ width: "100%", height: "700px", border: "none" }}
                title="Catálogo PDF"
              />
              <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b", textAlign: "center" }}>
                <a
                  href={catalogoSeleccionado.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#60a5fa", textDecoration: "none", fontSize: "13px" }}
                >
                  Abrir PDF en nueva pestaña →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Secciones y productos */}
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
          {seccionesFiltradas.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
              <p style={{ fontSize: "16px" }}>No se encontraron productos{soloDestacados ? " destacados" : ""} con esa búsqueda</p>
            </div>
          )}

          {seccionesFiltradas.map((seccion) => (
            <div key={seccion.titulo} style={{ marginBottom: "12px" }}>
              <button
                onClick={() => setSeccionAbierta(seccionAbierta === seccion.titulo ? null : seccion.titulo)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "#0f172a", border: "1px solid #1e293b",
                  borderRadius: seccionAbierta === seccion.titulo ? "12px 12px 0 0" : "12px",
                  cursor: "pointer", color: "#f8fafc", fontSize: "16px", fontWeight: 700,
                  textAlign: "left",
                }}
              >
                <span>{seccion.icon} {seccion.titulo} ({seccion.productos.length})</span>
                <span style={{ color: "#64748b", fontSize: "20px", transform: seccionAbierta === seccion.titulo ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
              </button>

              {seccionAbierta === seccion.titulo && (
                <div style={{
                  background: "#0f172a", border: "1px solid #1e293b", borderTop: "none",
                  borderRadius: "0 0 12px 12px", overflow: "hidden",
                }}>
                  {seccion.productos.map((producto, idx) => (
                    <div
                      key={`${producto.ref}-${idx}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 20px", borderTop: idx > 0 ? "1px solid #1e293b" : "none",
                        gap: "12px", flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{
                            background: catalogoSeleccionado.slug === "liqui-moly" ? "rgba(220,38,38,0.15)" : "rgba(205,127,50,0.15)",
                            color: catalogoSeleccionado.slug === "liqui-moly" ? "#fca5a5" : "#E8B86D",
                            padding: "3px 10px", borderRadius: "6px",
                            fontSize: "13px", fontWeight: 700, fontFamily: "monospace",
                          }}>
                            {producto.ref}
                          </span>
                          {producto.destacado && (
                            <span style={{ fontSize: "11px", background: "rgba(22,163,106,0.15)", color: "#4ade80", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                              ES
                            </span>
                          )}
                          <span style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600 }}>
                            {producto.nombre}
                          </span>
                        </div>
                        <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0 0" }}>
                          {producto.desc}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/buscar?ref=${encodeURIComponent(producto.ref)}&exact=1`}
                        style={{
                          padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                          background: "rgba(37,99,235,0.15)", color: "#60a5fa",
                          border: "1px solid rgba(37,99,235,0.3)", textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔍 Buscar stock
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // VISTA MARKETPLACE (LISTA DE CATÁLOGOS)
  // ═══════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>

      {/* Cabecera */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 6px 0" }}>
            📚 Catálogos de Proveedores
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Consulta catálogos completos de nuestros proveedores y busca referencias directamente en el stock disponible
          </p>

          {/* Barra de búsqueda */}
          <div style={{ marginTop: "16px" }}>
            <input
              type="text"
              placeholder="Buscar catálogo por marca..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%", maxWidth: "400px", padding: "10px 14px", borderRadius: "8px",
                border: "1px solid #334155", background: "#1e293b", color: "#f8fafc",
                fontSize: "14px", outline: "none",
              }}
            />
          </div>

          {/* Categorías */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            {CATEGORIAS_MARKETPLACE.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                style={{
                  padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer",
                  background: categoriaActiva === cat.id ? "rgba(37,99,235,0.2)" : "#1e293b",
                  color: categoriaActiva === cat.id ? "#60a5fa" : "#94a3b8",
                  border: categoriaActiva === cat.id ? "1px solid #2563eb" : "1px solid #334155",
                }}
              >
                {cat.icon} {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de catálogos */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          {catalogosFiltrados.map((catalogo) => {
            const totalRefs = catalogo.secciones.reduce((acc, s) => acc + s.productos.length, 0);
            const totalDestacados = catalogo.secciones.reduce((acc, s) => acc + s.productos.filter(p => p.destacado).length, 0);

            return (
              <div
                key={catalogo.slug}
                style={{
                  background: "#0f172a", borderRadius: "16px", overflow: "hidden",
                  border: "1px solid #1e293b", transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = catalogo.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "none"; }}
              >
                {/* Logo header */}
                <div style={{
                  padding: "24px", display: "flex", alignItems: "center", gap: "16px",
                  borderBottom: "1px solid #1e293b",
                  background: `linear-gradient(135deg, ${catalogo.color}15, transparent)`,
                }}>
                  {catalogo.slug === "liqui-moly" ? <LiquiMolyLogo size={90} /> : <AuxolLogo size={90} />}
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
                      {catalogo.marca}
                    </h3>
                    <div style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                      {totalRefs} referencias · {catalogo.secciones.length} secciones
                      {totalDestacados > 0 && <span style={{ color: "#4ade80" }}> · {totalDestacados} destacadas ES</span>}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div style={{ padding: "16px 24px" }}>
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
                    {catalogo.descripcion}
                  </p>
                </div>

                {/* Botones */}
                <div style={{ padding: "0 24px 20px" }}>
                  <button
                    onClick={() => { setCatalogoSeleccionado(catalogo); setSeccionAbierta(catalogo.secciones[0]?.titulo || null); }}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "10px", border: "none",
                      background: catalogo.color, color: "#fff", fontSize: "14px",
                      fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Ver catálogo
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {catalogosFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
            <p style={{ fontSize: "16px" }}>No se encontraron catálogos en esta categoría</p>
          </div>
        )}

        {/* Banner para proveedores */}
        <div
          style={{
            marginTop: "40px",
            background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(22,163,106,0.08))",
            border: "1px solid rgba(37,99,235,0.3)",
            borderRadius: "16px",
            padding: "32px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "48px", flexShrink: 0 }}>📦</div>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0", color: "#f8fafc" }}>
              ¿Eres proveedor? Publica tu catálogo en Recambio Directo
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              Haz visible tus productos a cientos de talleres en toda España. Contacta con nosotros y te ayudamos a dar de alta tu catálogo en nuestra plataforma.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="mailto:info@recambiodirecto.com"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px", borderRadius: "10px",
                  background: "#2563eb", color: "#fff", fontSize: "14px",
                  fontWeight: 600, textDecoration: "none",
                }}
              >
                ✉️ info@recambiodirecto.com
              </a>
              <a
                href="tel:+34968123456"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px", borderRadius: "10px",
                  border: "1px solid #334155", background: "transparent",
                  color: "#e2e8f0", fontSize: "14px", fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                📞 +34 968 123 456
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
