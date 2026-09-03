"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// ── TIPOS ──
interface Producto {
  ref: string;
  nombre: string;
  desc: string;
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
  logoText: string;
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

// ── CATÁLOGO COMPLETO LIQUI MOLY ──
const CATALOGOS: Catalogo[] = [
  {
    slug: "liqui-moly",
    marca: "Liqui Moly",
    descripcion: "Catálogo completo — Aditivos, Aceites, Cuidado del vehículo, Reparación, Taller, Pegamentos, Vehículos industriales, Moto/Marina y Equipamiento",
    color: "#dc2626",
    logoText: "LIQUI\nMOLY",
    categoriaFiltro: "lubricantes",
    pdfUrl: "/catalogos/liqui-moly-catalogo.pdf",
    secciones: [
      // ═══ ADITIVOS DE ACEITE ═══
      {
        titulo: "Aditivos de Aceite",
        icon: "🔧",
        productos: [
          { ref: "1001", nombre: "Hybrid Additive", desc: "Aditivo especial para vehículos híbridos. Protege el motor durante periodos prolongados de parada del motor térmico, evitando corrosión y desgaste" },
          { ref: "3721", nombre: "Cera Tec", desc: "Tratamiento cerámico antidesgaste. Forma una capa cerámica protectora que reduce la fricción y el desgaste hasta un 30%. Válido para 50.000 km" },
          { ref: "5200", nombre: "Oil Sludge Flush", desc: "Disuelve y elimina los lodos y depósitos del circuito de aceite del motor. Usar antes del cambio de aceite. Restaura la capacidad de lubricación" },
          { ref: "8364", nombre: "Oil Additive MoS2 300ml", desc: "Aditivo de aceite con bisulfuro de molibdeno MoS2. Reduce la fricción y el desgaste, alarga la vida del motor. Compatible con todos los aceites" },
          { ref: "2591", nombre: "Oil Additive MoS2 125ml", desc: "Aditivo de aceite con MoS2 en formato pequeño. Ideal para motores de menor cilindrada o motos" },
          { ref: "8359", nombre: "Motor Oil Saver 300ml", desc: "Reduce el consumo de aceite renovando la elasticidad de las juntas y retenes de goma. Detiene las fugas menores de aceite" },
          { ref: "1802", nombre: "Motor Oil Saver 150ml", desc: "Reductor de consumo de aceite formato compacto. Regenera juntas y retenes endurecidos" },
          { ref: "8374", nombre: "Engine Flush Plus", desc: "Limpieza interna rápida del motor en 10 minutos. Disuelve barnices, lacas y depósitos. Usar justo antes de cambiar el aceite" },
          { ref: "8367", nombre: "Hydraulic Lifter Additive 300ml", desc: "Elimina el ruido de taqués hidráulicos. Limpia los conductos de aceite finos y restaura el funcionamiento silencioso de los compensadores hidráulicos" },
          { ref: "2770", nombre: "Hydraulic Lifter Additive 150ml", desc: "Aditivo anti-ruido para taqués hidráulicos, formato compacto" },
          { ref: "8362", nombre: "Viscoplus for Oil 300ml", desc: "Estabilizador de viscosidad. Aumenta la viscosidad del aceite y reduce el consumo. Ideal para motores con holguras por desgaste" },
          { ref: "8958", nombre: "Viscoplus for Oil 150ml", desc: "Estabilizador de viscosidad formato compacto" },
          { ref: "1015", nombre: "Molygen Motor Protect", desc: "Protección antidesgaste con tecnología Molygen. Crea una capa protectora molecular que reduce la fricción y protege contra el desgaste" },
          { ref: "8360", nombre: "Oil Smoke Stop 300ml", desc: "Reduce el humo azul del escape causado por el consumo de aceite. Aumenta la viscosidad y mejora la compresión" },
          { ref: "8901", nombre: "Oil Smoke Stop 150ml", desc: "Reductor de humo de aceite formato compacto" },
          { ref: "1018", nombre: "Motor Protect", desc: "Protección antidesgaste de larga duración para el motor. Reduce la fricción metálica y previene el desgaste prematuro" },
          { ref: "1019", nombre: "Motor Clean", desc: "Limpiador de motor previo al cambio de aceite. Disuelve residuos de carbonilla, barnices y lodos del circuito de lubricación" },
        ],
      },
      // ═══ ADITIVOS GASOLINA ═══
      {
        titulo: "Aditivos Gasolina",
        icon: "⛽",
        productos: [
          { ref: "3720", nombre: "Speed Tec Gasoline", desc: "Mejora la aceleración y la respuesta del motor de gasolina. Optimiza la combustión y mantiene limpio el sistema de inyección" },
          { ref: "2507", nombre: "Carburetor & Valve Cleaner 300ml", desc: "Limpiador de carburador y válvulas. Elimina depósitos de carbonilla en válvulas de admisión y carburador. Mejora el ralentí" },
          { ref: "1818", nombre: "Carburetor & Valve Cleaner 150ml", desc: "Limpiador de carburador y válvulas formato compacto" },
          { ref: "8361", nombre: "Injection Cleaner 300ml", desc: "Limpiador de inyectores de gasolina. Elimina depósitos en inyectores, válvulas y cámara de combustión. Restaura el patrón de pulverización" },
          { ref: "1803", nombre: "Injection Cleaner 250ml", desc: "Limpiador de inyectores de gasolina formato compacto" },
          { ref: "8365", nombre: "Fuel System Treatment", desc: "Tratamiento completo del sistema de combustible. Limpia y protege todo el circuito: depósito, conductos, inyectores y válvulas" },
          { ref: "8351", nombre: "Octane Plus", desc: "Aumenta el octanaje de la gasolina hasta 4 puntos RON. Mejora la combustión y evita el picado de biela. Para motores de alto rendimiento" },
          { ref: "2956", nombre: "Octane Plus (grande)", desc: "Aumentador de octanaje formato grande para depósitos mayores" },
          { ref: "8373", nombre: "Valve Clean", desc: "Limpiador específico de válvulas de admisión. Elimina depósitos de carbonilla que afectan al cierre de válvulas y provocan pérdida de compresión" },
          { ref: "2952", nombre: "Valve Clean (grande)", desc: "Limpiador de válvulas formato grande" },
          { ref: "2530", nombre: "Fuel Protect", desc: "Protege contra la humedad y el agua en el combustible. Previene la corrosión del sistema de combustible y problemas de arranque en frío" },
          { ref: "2955", nombre: "Fuel Protect (grande)", desc: "Protección del combustible contra humedad, formato grande" },
          { ref: "1010", nombre: "Lead Substitute", desc: "Sustituto del plomo para motores antiguos. Protege los asientos de válvula en motores diseñados para gasolina con plomo" },
          { ref: "5107", nombre: "Petrol Stabiliser", desc: "Estabilizador de gasolina para almacenamiento prolongado. Evita el envejecimiento y la oxidación del combustible. Ideal para vehículos de temporada" },
          { ref: "21377", nombre: "DFI Cleaner 300ml", desc: "Limpiador para motores de inyección directa de gasolina. Elimina depósitos especialmente resistentes en inyectores de alta presión" },
          { ref: "21375", nombre: "DFI Cleaner 120ml", desc: "Limpiador de inyección directa formato compacto" },
        ],
      },
      // ═══ ADITIVOS DIÉSEL ═══
      {
        titulo: "Aditivos Diésel",
        icon: "🛢️",
        productos: [
          { ref: "3722", nombre: "Speed Tec Diesel", desc: "Mejora la aceleración y respuesta en motores diésel. Aumenta el índice de cetano y optimiza la combustión" },
          { ref: "3725", nombre: "Bio Diesel Additive", desc: "Aditivo especial para biodiésel. Compensa las deficiencias del biodiésel, protege contra corrosión y previene problemas de inyección" },
          { ref: "8366", nombre: "Super Diesel Additive 250ml", desc: "Aditivo súper diésel. Elimina depósitos en inyectores y cámara de combustión, aumenta el cetano, mejora la lubricidad y protege contra la corrosión" },
          { ref: "1806", nombre: "Super Diesel Additive 150ml", desc: "Aditivo súper diésel formato compacto" },
          { ref: "8363", nombre: "Diesel Smoke Stop 300ml", desc: "Reduce las emisiones de humo negro del escape diésel. Mejora la combustión y disminuye los valores de opacidad en la ITV" },
          { ref: "1808", nombre: "Diesel Smoke Stop 150ml", desc: "Reductor de humo diésel formato compacto" },
          { ref: "8372", nombre: "Common Rail Additive 250ml", desc: "Aditivo específico para sistemas Common Rail. Protege la bomba de alta presión e inyectores piezo/solenoide contra el desgaste" },
          { ref: "8953", nombre: "Common Rail Additive 150ml", desc: "Aditivo Common Rail formato compacto" },
          { ref: "7180", nombre: "Diesel Particulate Filter Protection", desc: "Protección del filtro de partículas DPF. Reduce la temperatura de combustión del hollín acumulado, facilitando la regeneración activa del filtro" },
          { ref: "5122", nombre: "Diesel Lubricity Additive", desc: "Aumenta la lubricidad del gasóleo. Compensa la reducción de azufre del diésel actual y protege la bomba de inyección contra el desgaste" },
          { ref: "8380", nombre: "Diesel Purge 500ml", desc: "Purga diésel profesional. Se conecta directamente al circuito de combustible para una limpieza intensiva de inyectores y bomba" },
          { ref: "1811", nombre: "Diesel Purge 1L", desc: "Purga diésel profesional formato grande" },
          { ref: "8929", nombre: "Diesel Flow Fit 150ml", desc: "Anticongelante para diésel. Evita la cristalización de parafinas en el gasóleo a bajas temperaturas, manteniendo la fluidez del combustible" },
          { ref: "5131", nombre: "Diesel Flow Fit 1L", desc: "Anticongelante diésel formato grande" },
          { ref: "21317", nombre: "Anti-Bacterial Diesel-Additive", desc: "Aditivo antibacteriano para diésel. Elimina bacterias y hongos (diesel pest) que se forman en depósitos de combustible con presencia de agua" },
          { ref: "21493", nombre: "Pro-Line Nfz-Dieselfilter Additiv", desc: "Aditivo profesional para filtros diésel de vehículos industriales. Mejora la filtración y previene la obstrucción prematura" },
          { ref: "21953", nombre: "Pro-Line Dieselfilter Additiv", desc: "Aditivo profesional para filtros diésel" },
          { ref: "21805", nombre: "E10 Additiv", desc: "Aditivo para combustible E10 (10% etanol). Protege el sistema de combustible contra los efectos corrosivos del etanol" },
        ],
      },
      // ═══ ADITIVOS REFRIGERACIÓN Y TRANSMISIÓN ═══
      {
        titulo: "Aditivos Refrigeración y Transmisión",
        icon: "❄️",
        productos: [
          { ref: "8369", nombre: "Radiator Cleaner 300ml", desc: "Limpiador de radiador y circuito de refrigeración. Elimina cal, óxido y depósitos de aceite. Usar antes de cambiar el anticongelante" },
          { ref: "1804", nombre: "Radiator Cleaner 150ml", desc: "Limpiador de radiador formato compacto" },
          { ref: "2533", nombre: "Radiator Stop Leak Plus", desc: "Sellador de fugas de radiador reforzado. Sella micro-fugas en radiador, calefactor, juntas y manguitos sin obstruir el circuito" },
          { ref: "8371", nombre: "Radiator Stop Leak 250ml", desc: "Sellador de fugas de radiador estándar" },
          { ref: "8956", nombre: "Radiator Stop Leak 150ml", desc: "Sellador de fugas de radiador formato compacto" },
          { ref: "5135", nombre: "ATF Additive 250ml", desc: "Aditivo para transmisión automática. Mejora el cambio, reduce las vibraciones y protege contra el desgaste de los componentes internos" },
          { ref: "8336", nombre: "ATF Additive 150ml", desc: "Aditivo para transmisión automática formato compacto" },
          { ref: "1007", nombre: "Gear Protect", desc: "Protección para engranajes. Crea una película protectora de MoS2 que reduce el desgaste y el ruido en cajas de cambio manuales" },
          { ref: "3321", nombre: "Transmission Cleaner", desc: "Limpiador interno de cajas de cambio. Disuelve barnices y depósitos que dificultan el engrane suave de las marchas" },
          { ref: "2512", nombre: "Automatic Transmission Cleaner", desc: "Limpiador de transmisión automática. Elimina depósitos del convertidor de par, cuerpo de válvulas y circuito hidráulico" },
          { ref: "1042", nombre: "Gear-Oil Leak Stop", desc: "Sellador de fugas de aceite de caja de cambios. Regenera las juntas y retenes de la transmisión" },
          { ref: "2510", nombre: "MoS2 Anti-Friction for Gears", desc: "Antifricción MoS2 para engranajes. Reduce el desgaste y el ruido de la caja de cambios manual" },
          { ref: "1099", nombre: "Power Steering Oil Leak Stop", desc: "Sellador de fugas de dirección asistida. Detiene pequeñas pérdidas regenerando los retenes del circuito hidráulico" },
        ],
      },
      // ═══ ACEITES DE MOTOR ═══
      {
        titulo: "Aceites de Motor",
        icon: "🛢️",
        productos: [
          { ref: "3706", nombre: "Top Tec 4200 5W-30", desc: "Aceite sintético longlife. Aprobaciones VW 504/507, BMW LL-04, MB 229.51, Porsche C30. Para intervalos de cambio extendidos" },
          { ref: "3707", nombre: "Top Tec 4200 5W-30 5L", desc: "Aceite Top Tec 4200 en garrafa de 5 litros" },
          { ref: "2316", nombre: "Top Tec 4100 5W-40", desc: "Aceite sintético de alto rendimiento. Aprobaciones BMW LL-01, MB 229.3, VW 502/505, Porsche A40. Polivalente para turismos europeos" },
          { ref: "3700", nombre: "Top Tec 4100 5W-40 5L", desc: "Aceite Top Tec 4100 en garrafa de 5 litros" },
          { ref: "9511", nombre: "Top Tec 4600 5W-30", desc: "Aceite para motores GM/Opel Dexos 2, BMW LL-04, MB 229.51. Baja ceniza (Mid SAPS) para vehículos con DPF" },
          { ref: "2315", nombre: "Top Tec 4600 5W-30 5L", desc: "Aceite Top Tec 4600 en garrafa de 5 litros" },
          { ref: "2317", nombre: "Leichtlauf High Tech 5W-40", desc: "Aceite sintético universal de alta tecnología. Múltiples aprobaciones: VW 502/505, BMW LL-01, MB 229.5, Porsche A40, Renault RN0700/0710" },
          { ref: "3864", nombre: "Leichtlauf High Tech 5W-40 5L", desc: "Leichtlauf High Tech en garrafa de 5 litros" },
          { ref: "8066", nombre: "Special Tec LL 5W-30", desc: "Aceite para vehículos GM/Opel (Dexos 2), BMW LL-04, MB 229.51, VW 502/505. Baja viscosidad para ahorro de combustible" },
          { ref: "2339", nombre: "Special Tec LL 5W-30 5L", desc: "Special Tec LL en garrafa de 5 litros" },
          { ref: "9509", nombre: "Special Tec F 5W-30", desc: "Aceite para vehículos Ford (WSS-M2C913-D). Ahorro de combustible Fuel Economy. Compatible con Ford, Jaguar, Land Rover" },
          { ref: "2326", nombre: "Special Tec F ECO 5W-20", desc: "Aceite ultra baja viscosidad para Ford EcoBoost. WSS-M2C948-B. Máximo ahorro de combustible en motores Ford modernos" },
          { ref: "3853", nombre: "Top Tec 4300 5W-30", desc: "Aceite para PSA/Stellantis B71 2290, MB 229.52. Baja ceniza ACEA C2 para motores con DPF de última generación" },
          { ref: "2324", nombre: "Top Tec 4400 5W-30", desc: "Aceite para Renault RN0720, PSA B71 2296. ACEA C3 de baja ceniza para motores diésel con DPF" },
          { ref: "2312", nombre: "Top Tec 4310 0W-30", desc: "Aceite de ultra baja viscosidad 0W-30 para VW 504/507, BMW LL-04, MB 229.51. Máxima protección en frío y ahorro de combustible" },
          { ref: "3701", nombre: "Top Tec 4410 5W-30", desc: "Aceite para VW 504/507, Porsche C30, ACEA C3. Longlife III para intervalos de cambio extendidos en grupo VAG" },
          { ref: "21210", nombre: "Top Tec 6300 0W-20", desc: "Aceite 0W-20 para VW 508/509. Baja viscosidad HTHS para motores EA211/EA888 evo. Máximo ahorro de combustible" },
          { ref: "21312", nombre: "Top Tec 6200 0W-20", desc: "Aceite 0W-20 para Toyota/Lexus. API SP, ILSAC GF-6A. Protección avanzada para motores híbridos y TNGA" },
          { ref: "21660", nombre: "Top Tec 6610 0W-20", desc: "Aceite 0W-20 de última generación para motores modernos europeos y asiáticos con requisitos de ultra baja viscosidad" },
          { ref: "21440", nombre: "Top Tec 6600 0W-20", desc: "Aceite 0W-20 Fuel Economy para motores que requieren ahorro máximo de combustible. ACEA C5/C6" },
          { ref: "21848", nombre: "Top Tec 4120 0W-40", desc: "Aceite 0W-40 sintético de alto rendimiento. Arranque instantáneo en frío extremo con protección completa a altas temperaturas" },
          { ref: "9066", nombre: "Molygen New Generation 5W-30", desc: "Aceite con tecnología Molygen (fluorescente). Protección antidesgaste superior, indicador de fugas UV. Múltiples aprobaciones" },
          { ref: "9089", nombre: "Molygen New Generation 5W-40", desc: "Aceite Molygen 5W-40 con protección molecular fluorescente. Detección visual de fugas con lámpara UV" },
          { ref: "21286", nombre: "Nachfüllöl 5W-30", desc: "Aceite de relleno 5W-30 universal. Compatible con la mayoría de aceites del mercado. Ideal para llevar en el maletero como reserva" },
          { ref: "21322", nombre: "Special Tec AA 0W-16", desc: "Aceite 0W-16 para motores japoneses y coreanos de última generación. Viscosidad ultra baja para máxima eficiencia" },
          { ref: "21330", nombre: "Special Tec AA 5W-40 Diesel", desc: "Aceite 5W-40 para motores diésel asiáticos y americanos. API CJ-4, ideal para pick-ups y SUV diésel importados" },
          { ref: "21767", nombre: "Special Tec AA 0W-8", desc: "Aceite de viscosidad extremadamente baja 0W-8 para motores híbridos y eléctricos japoneses de última generación" },
        ],
      },
      // ═══ ACEITES DE TRANSMISIÓN ═══
      {
        titulo: "Aceites de Transmisión",
        icon: "⚙️",
        productos: [
          { ref: "3682", nombre: "Top Tec ATF 1100", desc: "Aceite para transmisiones automáticas convencionales. Compatible con Dexron III, Mercon, Allison C-4. Para cajas automáticas clásicas" },
          { ref: "3687", nombre: "Top Tec ATF 1200", desc: "Aceite ATF sintético para cajas automáticas modernas de 6+ velocidades. BMW, MB, ZF, Toyota. Larga duración" },
          { ref: "3681", nombre: "Top Tec ATF 1400", desc: "Aceite ATF para transmisiones CVT y cajas de variación continua. Nissan, Mitsubishi, Honda, Subaru" },
          { ref: "21176", nombre: "Top Tec ATF 1600", desc: "Aceite para transmisiones automáticas de última generación. Compatible con cajas de 8 y 9 velocidades ZF y Aisin" },
          { ref: "21738", nombre: "Top Tec ATF 1850", desc: "Aceite ATF de alto rendimiento para cajas automáticas deportivas y de doble embrague" },
          { ref: "21603", nombre: "Zentralhydrauliköl 2600", desc: "Aceite para sistemas hidráulicos centrales. Dirección asistida, suspensión hidráulica, nivel automático. Color verde" },
          { ref: "21791", nombre: "Top Tec MTF 5400 75W-90", desc: "Aceite para cajas de cambio manuales 75W-90. GL-4+. Compatible con cajas PSA, Renault, Ford, BMW" },
          { ref: "21359", nombre: "Top Tec MTF 5300 70W-75W", desc: "Aceite de caja manual baja viscosidad 70W-75W. Para cajas que requieren fluidos GL-4 de baja fricción" },
          { ref: "3658", nombre: "Hypoid-Getriebeöl GL5 75W-90", desc: "Aceite para diferenciales y puentes traseros GL-5 75W-90. Sintético, para engranajes hipoides de alto rendimiento" },
          { ref: "21445", nombre: "Profi Nfz-Getriebeöl 75W-80 Z5", desc: "Aceite de caja para vehículos industriales 75W-80. Para cajas ZF Ecosplit y Ecomid de camiones" },
          { ref: "21419", nombre: "Lamellenkupplungsöl", desc: "Aceite específico para embragues lamelares (Haldex, multi-disco). Compatible con sistemas de tracción integral" },
          { ref: "21785", nombre: "Hydrauliköl HyPER SG1-32", desc: "Aceite hidráulico de alto rendimiento ISO 32. Para sistemas hidráulicos industriales y de maquinaria" },
          { ref: "21618", nombre: "Hydrauliköl HVLP 46", desc: "Aceite hidráulico HVLP ISO 46. Alto índice de viscosidad para uso en amplios rangos de temperatura" },
          { ref: "21702", nombre: "Top Tec Gear EV 510", desc: "Aceite de transmisión específico para vehículos eléctricos. Optimizado para reductoras de EV con altas RPM" },
          { ref: "21929", nombre: "Vollsynth. Hypoid-Getriebeöl GL4/5 75W-90", desc: "Aceite totalmente sintético para cajas y diferenciales GL-4/GL-5. Máxima protección para transmisiones exigentes" },
        ],
      },
      // ═══ GRASAS, PASTAS Y SPRAYS ═══
      {
        titulo: "Grasas, Pastas y Sprays",
        icon: "🧴",
        productos: [
          { ref: "3140", nombre: "Mehrzweckfett (Grasa multiuso)", desc: "Grasa de litio multiuso para rodamientos, bisagras, articulaciones y puntos de engrase general. Resistente al agua" },
          { ref: "3553", nombre: "Silikon-Spray", desc: "Spray de silicona. Lubrica, protege y aísla gomas, plásticos y superficies. Repele el agua. No mancha" },
          { ref: "3110", nombre: "Kupferpaste (Pasta de cobre)", desc: "Pasta antigripante de cobre. Para tornillos de escape, bujías, pinzas de freno. Resiste hasta 1100°C" },
          { ref: "3312", nombre: "Bremsen-Anti-Quietsch-Paste", desc: "Pasta antirruido para frenos. Se aplica en la parte trasera de las pastillas para eliminar chirridos y vibraciones" },
          { ref: "3079", nombre: "Keramik-Paste (Pasta cerámica)", desc: "Pasta cerámica blanca de alta temperatura. Para montajes de escape, bujías, sensores lambda. Resiste hasta 1400°C" },
          { ref: "4085", nombre: "Graphitfett (Grasa de grafito)", desc: "Grasa con grafito para articulaciones, cadenas y mecanismos sometidos a alta carga y presión" },
          { ref: "3075", nombre: "LM 47 MoS2 Langzeitfett", desc: "Grasa de larga duración con MoS2 para rodamientos, juntas homocinéticas y puntos de engrase con alta carga" },
          { ref: "3081", nombre: "Keramik-Spray (Spray cerámico)", desc: "Spray lubricante cerámico blanco. Para guías de freno, tornillería de escape, juntas roscadas. Soporta temperaturas extremas" },
          { ref: "21692", nombre: "Bike Keramik-Kettenspray", desc: "Spray cerámico para cadena de bicicleta. Lubricación de larga duración, no atrae suciedad, resistente al agua" },
          { ref: "21714", nombre: "Motorbike Kettenspray 400ml", desc: "Spray para cadena de moto. Lubricación duradera tipo O-ring, X-ring y Z-ring. Resistente a altas velocidades" },
          { ref: "21764", nombre: "Motorbike Kettenspray Race", desc: "Spray de cadena de competición para motos. Máxima adherencia a altas RPM. Compatible con retenes" },
        ],
      },
      // ═══ CUIDADO DEL VEHÍCULO ═══
      {
        titulo: "Cuidado del Vehículo",
        icon: "✨",
        productos: [
          { ref: "21611", nombre: "Detailer Lackschnellpflege", desc: "Cuidado rápido de la pintura tipo detailer. Aporta brillo instantáneo, elimina huellas y protege la superficie sin necesidad de agua" },
          { ref: "21670", nombre: "Universalreiniger extrem 10L", desc: "Limpiador universal extremo. Elimina grasa, aceite, insectos y suciedad persistente de cualquier superficie del vehículo" },
          { ref: "21672", nombre: "Felgenreiniger sauer 10L", desc: "Limpiador ácido para llantas. Elimina polvo de frenos incrustado, óxido y suciedad mineral de llantas de aleación" },
          { ref: "21674", nombre: "Glasreiniger 20L", desc: "Limpiacristales profesional para taller. Sin residuos, sin vetas. Para cristales, espejos y superficies reflectantes" },
          { ref: "21706", nombre: "Scheibenreiniger-Superkonzentrat cherry", desc: "Superconcentrado limpiaparabrisas aroma cereza. Alta concentración: 1 bote rinde hasta 100 litros de líquido" },
          { ref: "21710", nombre: "Glanzshampoo 25L", desc: "Champú de brillo profesional para túnel de lavado y lavado manual. Espuma abundante, enjuague fácil" },
          { ref: "21711", nombre: "Kraftschaum 25L", desc: "Espuma activa de prelavado. Ablanda y desprende la suciedad adherida antes del lavado principal" },
          { ref: "21712", nombre: "Glanztrockner 25L", desc: "Abrillantador y secador para máquinas de lavado. Acelera el secado y deja un acabado brillante sin marcas de agua" },
          { ref: "21678", nombre: "Scheibenfrostschutz Konzentrat", desc: "Anticongelante concentrado para limpiaparabrisas. Protección hasta -60°C mezclado con agua. Limpieza efectiva en invierno" },
          { ref: "21277", nombre: "Aktivschaumreiniger 500ml", desc: "Espuma activa limpiadora multiusos. Para tapicería, plásticos, vinilo y superficies textiles del interior del vehículo" },
          { ref: "21758", nombre: "Schleifpaste 1500", desc: "Pasta de pulir de grano 1500. Para eliminar arañazos finos, marcas de agua y defectos de pintura. Paso intermedio de pulido" },
          { ref: "21759", nombre: "Kratzerentferner 2000", desc: "Eliminador de arañazos grano 2000. Paso fino de corrección de pintura para eliminar microarañazos y marcas circulares" },
          { ref: "21760", nombre: "Lackreiniger 2500", desc: "Limpiador de pintura grano 2500. Paso de afinado para conseguir un acabado perfecto sin hologramas" },
          { ref: "21762", nombre: "Hochglanzpolitur", desc: "Pulimento de alto brillo. Paso final de pulido para un acabado espejo perfecto en la pintura" },
          { ref: "21763", nombre: "Hart- & Schutzwachs", desc: "Cera dura de protección. Sella y protege la pintura durante meses. Brillo profundo y efecto hidrofóbico" },
          { ref: "21830", nombre: "Air Freshener vanille", desc: "Ambientador para coche aroma vainilla" },
          { ref: "21831", nombre: "Air Freshener new car", desc: "Ambientador para coche aroma coche nuevo" },
          { ref: "21832", nombre: "Air Freshener cherry", desc: "Ambientador para coche aroma cereza" },
          { ref: "21833", nombre: "Air Freshener ocean", desc: "Ambientador para coche aroma océano" },
          { ref: "21781", nombre: "Handpolierschwamm weich (2 Stk)", desc: "Esponja de pulir manual suave (pack de 2). Para aplicar ceras y pulimentos a mano" },
          { ref: "21782", nombre: "Handpolierschwamm hart (2 Stk)", desc: "Esponja de pulir manual dura (pack de 2). Para aplicación de pastas de pulir y corrección" },
          { ref: "21783", nombre: "Microfasertuch Lack", desc: "Paño de microfibra especial para pintura. Ultra suave, no raya. Para retirar cera y pulimento" },
        ],
      },
      // ═══ LÍQUIDOS DE FRENOS Y REFRIGERANTE ═══
      {
        titulo: "Líquidos de Frenos y Refrigerante",
        icon: "🔴",
        productos: [
          { ref: "21155", nombre: "Bremsflüssigkeit DOT 4 250ml", desc: "Líquido de frenos DOT 4. Punto de ebullición seco 260°C, húmedo 165°C. Para sistemas de frenos hidráulicos convencionales" },
          { ref: "21157", nombre: "Bremsflüssigkeit DOT 4 1L", desc: "Líquido de frenos DOT 4 en envase de 1 litro" },
          { ref: "21158", nombre: "Bremsflüssigkeit DOT 4 5L", desc: "Líquido de frenos DOT 4 en garrafa de 5 litros para uso profesional en taller" },
          { ref: "21160", nombre: "Bremsflüssigkeit DOT 5.1 250ml", desc: "Líquido de frenos DOT 5.1 de alto rendimiento. Punto ebullición seco 272°C. Para ABS, ESP y sistemas de alta exigencia" },
          { ref: "21162", nombre: "Bremsflüssigkeit DOT 5.1 1L", desc: "Líquido de frenos DOT 5.1 en envase de 1 litro" },
          { ref: "21166", nombre: "Bremsflüssigkeit SL6 DOT 4 250ml", desc: "Líquido de frenos SL6 DOT 4 de baja viscosidad. Especial para sistemas con ABS/ESP de última generación" },
          { ref: "21729", nombre: "Bremsflüssigkeit DOT 5.1 EV 500ml", desc: "Líquido de frenos DOT 5.1 específico para vehículos eléctricos e híbridos. Formulación compatible con sistemas de frenado regenerativo" },
          { ref: "21130", nombre: "Kühlerfrostschutz KFS 33 1L", desc: "Anticongelante KFS 33 (color verde). Protección hasta -40°C. Compatible con la mayoría de motores europeos y asiáticos" },
          { ref: "21134", nombre: "Kühlerfrostschutz KFS 12++ 1L", desc: "Anticongelante KFS 12++ (color rojo/violeta). Para VW/Audi TL 774 G. Tecnología OAT de larga duración" },
          { ref: "21139", nombre: "Kühlerfrostschutz KFS 13 1L", desc: "Anticongelante KFS 13 (color violeta). Para VW TL 774 J (G13). Última generación, base etilenglicol con glicerina" },
          { ref: "21145", nombre: "Kühlerfrostschutz KFS 12+ 1L", desc: "Anticongelante KFS 12+ (color rojo). Para VW TL 774 D/F. Compatible con motores VAG anteriores a 2008" },
          { ref: "21313", nombre: "Kühlerfrostschutz universal 1L", desc: "Anticongelante universal mezclable con todos los colores. Ideal cuando no se conoce el tipo de anticongelante del vehículo" },
          { ref: "21740", nombre: "Kühlerfrostschutz KFS 12 Evo 1L", desc: "Anticongelante KFS 12 Evo (color rojo). Nueva generación para VW, Audi, Seat, Skoda. Tecnología Si-OAT" },
          { ref: "21745", nombre: "Batteriekühlflüssigkeit EV 200 5L", desc: "Líquido de refrigeración de baterías para vehículos eléctricos. Formulación especial de baja conductividad eléctrica" },
          { ref: "23152", nombre: "Kühlerfrostschutz KFS 18 1L", desc: "Anticongelante KFS 18. Para aplicaciones específicas de determinados fabricantes asiáticos y americanos" },
        ],
      },
      // ═══ REPARACIÓN Y SERVICIO ═══
      {
        titulo: "Reparación y Servicio",
        icon: "🔧",
        productos: [
          { ref: "3304", nombre: "Rostlöser (Aflojatodo)", desc: "Aflojatodo penetrante. Afloja tuercas y tornillos oxidados y agarrotados. Desplaza la humedad y protege contra la corrosión" },
          { ref: "3390", nombre: "Multi-Spray Plus 7", desc: "Spray multifunción 7 en 1: afloja, lubrica, protege, limpia, penetra, desplaza agua y mantiene. El multiusos del taller" },
          { ref: "3391", nombre: "LM 40 Multi-Funktions-Spray", desc: "Spray multifunción LM 40. Aflojatodo, lubricante, protector contra la corrosión y limpiador en uno" },
          { ref: "21485", nombre: "Klimaanlagenreiniger 250ml", desc: "Limpiador de climatización y conductos de aire. Elimina bacterias, hongos y malos olores del sistema de climatización" },
          { ref: "21921", nombre: "Klimaanlagenreiniger 1L", desc: "Limpiador de climatización formato profesional 1L para talleres" },
          { ref: "21594", nombre: "Pro-Line Motorspülung", desc: "Limpieza profesional del motor previo al cambio de aceite. Fórmula concentrada para uso en taller con máquina de limpieza" },
          { ref: "21969", nombre: "DPF-/OPF-Reiniger 400ml", desc: "Limpiador de filtro de partículas DPF/OPF. Limpieza sin desmontar el filtro. Reduce la contrapresión y restaura el rendimiento" },
          { ref: "21956", nombre: "Pro-Line JetClean Diesel-System-Reiniger", desc: "Limpiador profesional del sistema diésel para máquina JetClean. Limpieza completa de inyectores, bomba y conductos" },
          { ref: "21204", nombre: "Bremsenführungsstiftefett", desc: "Grasa para pasadores guía de pinza de freno. Especial para altas temperaturas, no se endurece ni se lava" },
          { ref: "21919", nombre: "Keramik Pulverspray 400ml", desc: "Spray de polvo cerámico. Lubricante seco cerámico para guías de freno, pernos de escape y montajes de alta temperatura" },
          { ref: "21950", nombre: "Liquifast 9100 310ml", desc: "Adhesivo para parabrisas de alta resistencia. Curado rápido, tiempo de retención 1 hora. Para sustitución de lunas" },
          { ref: "21945", nombre: "Schraubensicherung Spezial 10ml", desc: "Frenador de roscas especial. Media resistencia, desmontable con herramienta manual. Para tornillería que requiere seguridad" },
          { ref: "21976", nombre: "Pro-Line ATF Additiv 250ml", desc: "Aditivo profesional para transmisión automática. Mejora el cambio, reduce tirones y protege el embrague convertidor" },
          { ref: "21800", nombre: "SCR Anti-Kristall Additiv", desc: "Aditivo anti-cristalización para sistemas SCR (AdBlue). Previene la formación de cristales de urea en inyectores y conductos" },
        ],
      },
      // ═══ PEGAMENTOS Y SELLADORES ═══
      {
        titulo: "Pegamentos y Selladores",
        icon: "🔩",
        productos: [
          { ref: "6127", nombre: "Scheibenkleber (Pegamento parabrisas)", desc: "Adhesivo de poliuretano para parabrisas. Alta resistencia estructural, curado rápido. Para montaje profesional de lunas" },
          { ref: "6103", nombre: "Verbundglasreparatur-Set", desc: "Kit de reparación de lunas laminadas. Repara impactos de piedra de hasta 25mm sin sustituir el parabrisas" },
          { ref: "3080", nombre: "Silikon-Dichtstoff schwarz", desc: "Sellador de silicona negro resistente al aceite. Para juntas de cárter, tapas de distribución y culata. Resiste hasta 200°C" },
          { ref: "6185", nombre: "Silikon-Dichtstoff rot", desc: "Sellador de silicona rojo de alta temperatura. Para colectores de escape, turbo y zonas de calor extremo. Hasta 300°C" },
          { ref: "3423", nombre: "Auspuff-Zement", desc: "Cemento para escape. Sella y repara fisuras y agujeros en tubos de escape, silenciadores y catalizadores" },
          { ref: "21262", nombre: "Liquimate 2K Sekundenkleber", desc: "Pegamento instantáneo de dos componentes. Unión ultra fuerte en segundos para metal, plástico, goma y cerámica" },
          { ref: "21341", nombre: "Liquimate 8400 Karosseriedichtmasse weiß", desc: "Masilla selladora de carrocería blanca. Para juntas de carrocería, costuras soldadas y uniones de chapa" },
          { ref: "6186", nombre: "Unterbodenschutz Bitumen schwarz", desc: "Protección de bajos bituminosa negra. Protege contra piedras, sal, humedad y corrosión en los bajos del vehículo" },
          { ref: "6112", nombre: "Hohlraumversiegelung", desc: "Sellador de cavidades / cera de cavidades. Protege las cavidades internas de la carrocería contra la oxidación" },
          { ref: "6190", nombre: "Korrosionsschutz", desc: "Protección anticorrosión en spray. Crea una película cerosa protectora sobre superficies metálicas expuestas" },
        ],
      },
      // ═══ VEHÍCULOS INDUSTRIALES ═══
      {
        titulo: "Vehículos Industriales",
        icon: "🚛",
        productos: [
          { ref: "21414", nombre: "NFZ-Langzeitfett KP2K-30", desc: "Grasa de larga duración para vehículos industriales. Rodamientos de rueda, pivotes de dirección y puntos de engrase de camiones" },
          { ref: "21415", nombre: "NFZ-Mehrzweckfett K2K-20", desc: "Grasa multiuso para vehículos industriales. Para quinta rueda, pernos de remolque y engrase general de camión" },
          { ref: "21907", nombre: "Top Tec Truck 6150 5W-30", desc: "Aceite de motor para camiones Euro 6. Baja ceniza, ahorro de combustible. MAN M 3677, MB 228.51, Volvo VDS-4.5" },
          { ref: "21263", nombre: "Top Tec Truck 4650 10W-30", desc: "Aceite para camiones y autobuses 10W-30. MAN M 3575, MB 228.5, Renault Trucks RLD-3. Para intervalos extendidos" },
          { ref: "21613", nombre: "Doppelkupplungsgetriebeöl 8100 205L", desc: "Aceite para cajas de doble embrague en barril de 205L. Para flotas con cajas DSG y PowerShift" },
          { ref: "21684", nombre: "Brennstoffzellen-Kühlmittel FCF20", desc: "Refrigerante para vehículos de pila de combustible de hidrógeno. Baja conductividad eléctrica, protección anticorrosión" },
          { ref: "21898", nombre: "SCR Anti-Kristall Additiv Konzentrat", desc: "Anti-cristalizante concentrado para sistemas SCR de vehículos industriales. Previene la obstrucción del sistema AdBlue" },
        ],
      },
      // ═══ MOTO Y BICICLETA ═══
      {
        titulo: "Moto y Bicicleta",
        icon: "🏍️",
        productos: [
          { ref: "1502", nombre: "Motorbike 4T 10W-40 Street 1L", desc: "Aceite para motos de calle 10W-40. JASO MA2, API SN. Embrague en baño de aceite compatible. Para naked, sport y touring" },
          { ref: "21153", nombre: "Motorbike 4T 0W-30 Scooter", desc: "Aceite para scooter 0W-30. Baja viscosidad para motores de scooter de 4 tiempos. Arranque rápido, ahorro de combustible" },
          { ref: "21460", nombre: "Motorbike HD Synth 20W-50 Street", desc: "Aceite sintético para Harley-Davidson y V-Twin. 20W-50 especial para motores de gran cilindrada refrigerados por aire" },
          { ref: "21339", nombre: "Motorbike 4T Synth 10W-40 Street Race", desc: "Aceite de competición para motos 10W-40 totalmente sintético. Máximo rendimiento para circuito y uso deportivo" },
          { ref: "21633", nombre: "2T Motoröl Race Tec", desc: "Aceite de 2 tiempos sintético de competición. Baja formación de humo, máxima protección. Para motos de 2T de alto rendimiento" },
          { ref: "21725", nombre: "Motorbike 4T 10W-50 Street 1L", desc: "Aceite para motos deportivas 10W-50. Alta viscosidad para motores sometidos a altas temperaturas y RPM extremas" },
          { ref: "21753", nombre: "Motorbike Gear Oil 10W-40", desc: "Aceite de caja de cambios para motos con transmisión separada. Honda, Kawasaki y otros con cárter de caja independiente" },
          { ref: "21600", nombre: "Motorbike Benzinstabilisator Shooter", desc: "Estabilizador de gasolina formato dosificador para motos. Protege el combustible durante la invernada o almacenamiento" },
          { ref: "21680", nombre: "Motorbike Detailer 500ml", desc: "Limpiador rápido y abrillantador para motos. Limpia sin agua, aporta brillo y protege la pintura y plásticos" },
          { ref: "23145", nombre: "Bike Detailer 500ml", desc: "Limpiador y abrillantador rápido para bicicletas. Limpieza sin agua del cuadro, horquilla y componentes" },
        ],
      },
      // ═══ MARINA ═══
      {
        titulo: "Marina",
        icon: "⚓",
        productos: [
          { ref: "25000", nombre: "Marine Diesel Schutz 500ml", desc: "Protección del sistema diésel para embarcaciones. Previene la corrosión, protege los inyectores y estabiliza el combustible marino" },
          { ref: "25004", nombre: "Marine Super Diesel Additiv 500ml", desc: "Aditivo súper diésel marino. Limpia inyectores, aumenta el cetano y mejora la combustión en motores marinos" },
          { ref: "25008", nombre: "Marine Benzinstabilisator 500ml", desc: "Estabilizador de gasolina para embarcaciones. Protege el combustible durante el amarre invernal o largos periodos sin uso" },
          { ref: "25012", nombre: "Marine 4T Motor Oil 10W-40 1L", desc: "Aceite de motor marino 4T 10W-40. Protección anticorrosión reforzada para motores fueraborda y intraborda" },
          { ref: "25019", nombre: "Marine 2T Motor Oil 1L", desc: "Aceite de 2 tiempos para motores fueraborda. Baja emisión de humo, biodegradable. Mezcla o inyección de aceite" },
          { ref: "25030", nombre: "Marine Getriebeöl GL4/GL5 80W-90", desc: "Aceite para cola, pata y reductora de embarcaciones. GL-4/GL-5. Protección anticorrosión marina" },
          { ref: "25082", nombre: "Marine Antifreeze 5L", desc: "Anticongelante marino. Para circuitos de refrigeración de motores marinos. Protección anticorrosión específica para entorno salino" },
          { ref: "25098", nombre: "Marine Detailer 500ml", desc: "Limpiador y abrillantador rápido para embarcaciones. Elimina sal, suciedad y deja un acabado brillante protector" },
        ],
      },
      // ═══ EQUIPAMIENTO DE TALLER ═══
      {
        titulo: "Equipamiento de Taller",
        icon: "🔩",
        productos: [
          { ref: "29002", nombre: "Altölsammel-/absauggerät", desc: "Aspirador y recolector de aceite usado con cilindro medidor de vidrio. Para taller profesional de cambio de aceite" },
          { ref: "29012", nombre: "Dosier-Center", desc: "Centro de dosificación para productos Liqui Moly. Permite dispensar aditivos y productos en la dosis exacta de forma profesional" },
          { ref: "29013", nombre: "Ölförderanlage \"Pumpmatic\"", desc: "Bomba eléctrica de trasiego de aceite. Para rellenar y extraer aceite de barriles y contenedores IBC" },
          { ref: "29077", nombre: "Tornador Gun", desc: "Pistola de limpieza Tornador. Limpieza profunda de tapicerías, moquetas y plásticos con aire comprimido y producto" },
          { ref: "29206", nombre: "Werkstattwagen", desc: "Carro de taller profesional Liqui Moly. Organización de herramientas y productos para el puesto de trabajo" },
          { ref: "29266", nombre: "Gear Tronic III", desc: "Máquina de cambio de aceite de transmisión automática. Cambio por flujo completo sin desmontar el cárter" },
          { ref: "29489", nombre: "JetClean Tronic III", desc: "Máquina de limpieza de sistemas de inyección. Limpieza profesional de inyectores sin desmontar, con programa automático" },
          { ref: "29490", nombre: "JetClean Tronic III Pro", desc: "Versión profesional avanzada de la máquina JetClean. Incluye programas para diésel, gasolina y limpieza de DPF" },
          { ref: "29523", nombre: "Brake Fluid Tronic", desc: "Máquina de purgado y cambio de líquido de frenos. Purgado automático de circuitos ABS/ESP sin asistente" },
          { ref: "29524", nombre: "Brake Fluid Tronic Adapter Set", desc: "Set de adaptadores para la máquina Brake Fluid Tronic. Cubre la mayoría de depósitos de líquido de frenos del mercado" },
          { ref: "29020", nombre: "Gear Tronic Adapter für DSG", desc: "Adaptador Gear Tronic para cajas DSG del grupo VAG. Conexión directa al circuito de aceite de la caja de doble embrague" },
          { ref: "29017", nombre: "Gear Tronic Adapter BMW07/VAG13", desc: "Adaptador Gear Tronic para transmisiones automáticas BMW serie 7 y VAG con caja de 13 pines" },
          { ref: "29373", nombre: "Akkufettpresse 20V Li-Ion", desc: "Engrasadora a batería 20V. Para engrase de vehículos sin compresor. Alta presión, batería recargable de larga duración" },
        ],
      },
    ],
  },
];

// ── COMPONENTE PRINCIPAL ──
export default function CatalogosPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [categoriaMarketplace, setCategoriaMarketplace] = useState("todos");
  const [catalogoAbierto, setCatalogoAbierto] = useState<Catalogo | null>(null);
  const [seccionActiva, setSeccionActiva] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaMarketplace, setBusquedaMarketplace] = useState("");
  const [vistaActiva, setVistaActiva] = useState<"productos" | "pdf">("productos");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const catalogosFiltrados = useMemo(() => {
    if (categoriaMarketplace === "todos") return CATALOGOS;
    return CATALOGOS.filter(c => c.categoriaFiltro === categoriaMarketplace);
  }, [categoriaMarketplace]);

  const catalogosBuscados = useMemo(() => {
    if (!busquedaMarketplace.trim()) return catalogosFiltrados;
    const q = busquedaMarketplace.toLowerCase();
    return catalogosFiltrados.filter(c =>
      c.marca.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
    );
  }, [catalogosFiltrados, busquedaMarketplace]);

  function totalRefs(cat: Catalogo) {
    return cat.secciones.reduce((acc, s) => acc + s.productos.length, 0);
  }

  // Búsqueda global en catálogo abierto
  const resultadosGlobales = useMemo(() => {
    if (!catalogoAbierto || !busqueda.trim()) return null;
    const q = busqueda.toLowerCase();
    const resultados: { seccion: string; producto: Producto }[] = [];
    catalogoAbierto.secciones.forEach(s => {
      s.productos.forEach(p => {
        if (p.ref.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) {
          resultados.push({ seccion: s.titulo, producto: p });
        }
      });
    });
    return resultados;
  }, [catalogoAbierto, busqueda]);

  // ══════════════════════════════════════════════
  // VISTA: CATÁLOGO ABIERTO
  // ══════════════════════════════════════════════
  if (catalogoAbierto) {
    const secActiva = catalogoAbierto.secciones[seccionActiva];
    const busquedaActiva = busqueda.trim().length > 0;

    return (
      <main style={{ padding: isMobile ? 12 : 32, maxWidth: 1300, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => { setCatalogoAbierto(null); setBusqueda(""); setSeccionActiva(0); setVistaActiva("productos"); }}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            ← Catálogos
          </button>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 900, marginBottom: 2, color: "white" }}>
              <span style={{ color: catalogoAbierto.color }}>{catalogoAbierto.marca}</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
              {catalogoAbierto.secciones.length} secciones · {totalRefs(catalogoAbierto)} referencias
            </p>
          </div>
        </div>

        {/* Toggle: Productos / PDF */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setVistaActiva("productos")}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
              background: vistaActiva === "productos" ? "#2563eb" : "transparent",
              color: vistaActiva === "productos" ? "white" : "#94a3b8",
              cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.2s",
            }}
          >
            📦 Productos y Referencias
          </button>
          <button
            onClick={() => setVistaActiva("pdf")}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
              background: vistaActiva === "pdf" ? "#2563eb" : "transparent",
              color: vistaActiva === "pdf" ? "white" : "#94a3b8",
              cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.2s",
            }}
          >
            📄 Ver Catálogo PDF
          </button>
        </div>

        {/* ── VISTA PDF ── */}
        {vistaActiva === "pdf" && (
          <div>
            {/* Botón descarga */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <a
                href={catalogoAbierto.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: catalogoAbierto.color, color: "white",
                  padding: "10px 20px", borderRadius: 10, textDecoration: "none",
                  fontWeight: 700, fontSize: 14, transition: "opacity 0.2s",
                }}
              >
                📥 Descargar PDF completo
              </a>
              <a
                href={catalogoAbierto.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "white", padding: "10px 20px", borderRadius: 10,
                  textDecoration: "none", fontWeight: 700, fontSize: 14,
                }}
              >
                🔗 Abrir en nueva pestaña
              </a>
            </div>
            {/* Visor PDF embebido */}
            <div style={{ background: "#0a0a0a", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              <iframe
                src={catalogoAbierto.pdfUrl}
                style={{ width: "100%", height: isMobile ? "70vh" : "80vh", border: "none" }}
                title={`Catálogo ${catalogoAbierto.marca}`}
              />
            </div>
          </div>
        )}

        {/* ── VISTA PRODUCTOS ── */}
        {vistaActiva === "productos" && (
          <>
            {/* Buscador */}
            <div style={{ marginBottom: 16 }}>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="🔍 Buscar por referencia, nombre o descripción..."
                style={{ width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Info */}
            <div style={{ background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <p style={{ color: "#93c5fd", fontSize: 12, margin: 0 }}>Haz clic en cualquier producto para buscarlo en el marketplace y ver qué proveedores lo tienen disponible.</p>
            </div>

            {/* Búsqueda global activa */}
            {busquedaActiva && resultadosGlobales ? (
              <div>
                <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
                  {resultadosGlobales.length} resultado{resultadosGlobales.length !== 1 ? "s" : ""} en todo el catálogo para &quot;{busqueda}&quot;
                </p>
                {resultadosGlobales.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                    <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>🔍</span>
                    <p>No se encontraron productos</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {resultadosGlobales.map((r, i) => (
                      <Link
                        key={`${r.producto.ref}-${i}`}
                        href={`/dashboard/buscar?q=${encodeURIComponent(r.producto.ref)}&exact=1`}
                        style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: isMobile ? "14px" : "16px 20px", textDecoration: "none", color: "white", transition: "border-color 0.2s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = catalogoAbierto.color; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                      >
                        <div style={{ flexShrink: 0, minWidth: 68, height: 42, borderRadius: 10, background: `${catalogoAbierto.color}15`, border: `1px solid ${catalogoAbierto.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: catalogoAbierto.color, fontWeight: 900, fontSize: 14, fontFamily: "monospace" }}>{r.producto.ref}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{r.producto.nombre}</p>
                          <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, lineHeight: 1.4 }}>{r.producto.desc}</p>
                          <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, color: "#64748b", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 6 }}>{r.seccion}</span>
                        </div>
                        <span style={{ color: "#475569", fontSize: 18, flexShrink: 0, marginTop: 4 }}>→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Tabs de secciones */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
                  {catalogoAbierto.secciones.map((sec, i) => (
                    <button
                      key={sec.titulo}
                      onClick={() => setSeccionActiva(i)}
                      style={{
                        flexShrink: 0, padding: isMobile ? "8px 12px" : "8px 16px", borderRadius: 10,
                        border: seccionActiva === i ? `1px solid ${catalogoAbierto.color}` : "1px solid rgba(255,255,255,0.06)",
                        background: seccionActiva === i ? `${catalogoAbierto.color}18` : "rgba(255,255,255,0.02)",
                        color: seccionActiva === i ? catalogoAbierto.color : "#94a3b8",
                        cursor: "pointer", fontWeight: 700, fontSize: isMobile ? 11 : 13, whiteSpace: "nowrap", transition: "all 0.2s",
                      }}
                    >
                      {sec.icon} {sec.titulo} <span style={{ opacity: 0.5, marginLeft: 2, fontSize: 10 }}>({sec.productos.length})</span>
                    </button>
                  ))}
                </div>

                {/* Lista de productos con descripción */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {secActiva?.productos.map((prod, i) => (
                    <Link
                      key={`${prod.ref}-${i}`}
                      href={`/dashboard/buscar?q=${encodeURIComponent(prod.ref)}&exact=1`}
                      style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: isMobile ? "14px" : "16px 20px", textDecoration: "none", color: "white", transition: "border-color 0.2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = catalogoAbierto.color; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                    >
                      <div style={{ flexShrink: 0, minWidth: 68, height: 42, borderRadius: 10, background: `${catalogoAbierto.color}15`, border: `1px solid ${catalogoAbierto.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: catalogoAbierto.color, fontWeight: 900, fontSize: 14, fontFamily: "monospace" }}>{prod.ref}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{prod.nombre}</p>
                        <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{prod.desc}</p>
                      </div>
                      <span style={{ color: "#475569", fontSize: 18, flexShrink: 0, marginTop: 4 }}>→</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    );
  }

  // ══════════════════════════════════════════════
  // VISTA: MARKETPLACE DE CATÁLOGOS
  // ══════════════════════════════════════════════
  return (
    <main style={{ padding: isMobile ? 12 : 32, maxWidth: 1300, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 900, marginBottom: 6, color: "white" }}>
          📚 Catálogos y Promociones
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
          Explora los catálogos de los principales fabricantes y distribuidores del sector
        </p>
      </div>

      {/* Buscador marketplace */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={busquedaMarketplace}
          onChange={e => setBusquedaMarketplace(e.target.value)}
          placeholder="🔍 Buscar catálogo por marca o descripción..."
          style={{ width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Categorías */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        {CATEGORIAS_MARKETPLACE.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoriaMarketplace(cat.id)}
            style={{
              flexShrink: 0, padding: isMobile ? "8px 14px" : "10px 20px", borderRadius: 10,
              border: categoriaMarketplace === cat.id ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.08)",
              background: categoriaMarketplace === cat.id ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.03)",
              color: categoriaMarketplace === cat.id ? "#60a5fa" : "#94a3b8",
              cursor: "pointer", fontWeight: 700, fontSize: isMobile ? 12 : 13, whiteSpace: "nowrap", transition: "all 0.2s",
            }}
          >
            {cat.icon} {cat.nombre}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: isMobile ? "stretch" : "flex-start", flexDirection: isMobile ? "column" : "row" }}>
        {/* Sidebar filtros (desktop) */}
        {!isMobile && (
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: "white" }}>Categorías</h3>
              {CATEGORIAS_MARKETPLACE.map(cat => (
                <label
                  key={cat.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", color: categoriaMarketplace === cat.id ? "#60a5fa" : "#94a3b8", fontSize: 13, fontWeight: categoriaMarketplace === cat.id ? 700 : 400 }}
                  onClick={() => setCategoriaMarketplace(cat.id)}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: categoriaMarketplace === cat.id ? "2px solid #2563eb" : "1px solid rgba(255,255,255,0.15)", background: categoriaMarketplace === cat.id ? "#2563eb" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {categoriaMarketplace === cat.id && <span style={{ color: "white", fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                  {cat.nombre}
                </label>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 16, paddingTop: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: "white" }}>Marcas</h3>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid #2563eb", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "white", fontSize: 10, fontWeight: 900 }}>✓</span>
                  </div>
                  Liqui Moly
                </label>
                <p style={{ color: "#475569", fontSize: 11, marginTop: 8 }}>Más marcas próximamente...</p>
              </div>
            </div>
            {/* Banner distribuidor */}
            <div style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 14, padding: 18, marginTop: 16, textAlign: "center" }}>
              <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>📢</span>
              <p style={{ color: "white", fontWeight: 800, fontSize: 14, marginBottom: 4 }}>¿Eres distribuidor?</p>
              <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>Publica tu catálogo aquí y llega a más talleres</p>
              <button style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", width: "100%" }}>
                Más información
              </button>
            </div>
          </div>
        )}

        {/* Grid de catálogos */}
        <div style={{ flex: 1 }}>
          {isMobile && (
            <div style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.12))", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>📢</span>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>¿Eres distribuidor?</p>
                <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>Publica tu catálogo y llega a más talleres</p>
              </div>
            </div>
          )}

          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
            {catalogosBuscados.length} catálogo{catalogosBuscados.length !== 1 ? "s" : ""} disponible{catalogosBuscados.length !== 1 ? "s" : ""}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 10 : 16 }}>
            {catalogosBuscados.map(cat => (
              <button
                key={cat.slug}
                onClick={() => { setCatalogoAbierto(cat); setBusqueda(""); setSeccionActiva(0); setVistaActiva("productos"); }}
                style={{
                  background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16,
                  padding: isMobile ? 16 : 20, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cat.color; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ width: isMobile ? 70 : 90, height: isMobile ? 70 : 90, borderRadius: 16, background: `linear-gradient(135deg, ${cat.color}25, ${cat.color}10)`, border: `2px solid ${cat.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: cat.color, fontWeight: 900, fontSize: isMobile ? 11 : 14, lineHeight: 1.2, whiteSpace: "pre-line", textAlign: "center" }}>{cat.logoText}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: isMobile ? 13 : 15, color: "white", marginBottom: 2 }}>{cat.marca}</p>
                  <p style={{ color: "#64748b", fontSize: 11 }}>{totalRefs(cat)} referencias</p>
                </div>
              </button>
            ))}

            {["Bosch", "Mann Filter", "NGK", "Sachs", "Febi Bilstein", "Continental", "SKF", "Valeo"].map(marca => (
              <div
                key={marca}
                style={{
                  background: "rgba(15,23,42,0.4)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16,
                  padding: isMobile ? 16 : 20, textAlign: "center", opacity: 0.5,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}
              >
                <div style={{ width: isMobile ? 70 : 90, height: isMobile ? 70 : 90, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#475569", fontSize: 24 }}>📦</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, color: "#64748b", marginBottom: 2 }}>{marca}</p>
                  <p style={{ color: "#475569", fontSize: 11 }}>Próximamente</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
