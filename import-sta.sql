-- ══════════════════════════════════════════════════════════════
-- IMPORTACIÓN CATÁLOGO STA - Soluciones Técnicas de Automoción
-- 32 referencias, 8 familias
-- Precios PROFESIONAL (sin IVA, -30% sobre PVP)
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ⚠️  IMPORTANTE: Reemplaza TU_PROVEEDOR_ID con tu ID real de usuario
-- Lo puedes sacar de: SELECT id FROM auth.users WHERE email = 'vicente@rgranvia.es';
-- Y TU_NOMBRE_PROVEEDOR con el nombre que aparece en tu perfil

DO $$
DECLARE
  v_proveedor_id UUID;
  v_proveedor_nombre TEXT;
BEGIN
  -- Obtener el proveedor_id del usuario
  SELECT id INTO v_proveedor_id FROM auth.users WHERE email = 'vicente@rgranvia.es';

  -- Obtener nombre del proveedor (ajusta la tabla si es diferente)
  SELECT COALESCE(raw_user_meta_data->>'nombre', raw_user_meta_data->>'full_name', 'Granvia Automoción')
  INTO v_proveedor_nombre
  FROM auth.users WHERE id = v_proveedor_id;

  -- Eliminar productos STA anteriores si los hubiera
  DELETE FROM piezas_publicadas
  WHERE proveedor_id = v_proveedor_id
    AND marca = 'STA';

  -- ════════════════════════════════════════
  -- FAMILIA 1: Lubricación y motor (5 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('STA-2-100', 'STA2100', 'STA', 'Motor PROTECT + Antifricción motor 250 ml', 'Tratamiento antifricción para motor. Reduce el rozamiento entre piezas móviles, disminuye el consumo y las emisiones, y prolonga la vida del motor. Envase de 250 ml para turismos.', 'IAM', 'taller', 18.02, v_proveedor_id, v_proveedor_nombre),
  ('STA-10-100', 'STA10100', 'STA', 'Motor PROTECT + Antifricción motor 1 L', 'Tratamiento antifricción para motor en formato 1 litro, indicado para vehículo industrial y motores de gran cilindrada. Reduce rozamiento, consumo y desgaste.', 'IAM', 'taller', 54.11, v_proveedor_id, v_proveedor_nombre),
  ('TLA-20228', 'TLA20228', 'STA', 'Limpieza interna motor con antifricción 250 ml', 'Limpiador interno de motor con aditivo antifricción. Disuelve lodos, barnices y depósitos antes del cambio de aceite. Envase de 250 ml.', 'IAM', 'taller', 15.76, v_proveedor_id, v_proveedor_nombre),
  ('TLA-20229', 'TLA20229', 'STA', 'Limpieza interna motor con antifricción 1 L', 'Limpiador interno de motor con aditivo antifricción en formato 1 litro, para motores de gran cilindrada y vehículo industrial.', 'IAM', 'taller', 47.32, v_proveedor_id, v_proveedor_nombre),
  ('STA-20234', 'STA20234', 'STA', 'Antifricción transmisiones AUTOMÁTICAS 1 L', 'Tratamiento antifricción para cajas de cambio automáticas. Suaviza los cambios, reduce la temperatura de trabajo y alarga la vida de la transmisión. Formato 1 litro.', 'IAM', 'taller', 63.87, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 2: AdBlue y SCR (2 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('STA-9-101', 'STA9101', 'STA', 'Adblu Protec ANTICRISTALIZANTE 250 ml', 'Aditivo anticristalizante para sistemas AdBlue y SCR. Evita la cristalización de la urea en el inyector y el catalizador, previniendo averías costosas. Envase de 250 ml.', 'IAM', 'taller', 15.40, v_proveedor_id, v_proveedor_nombre),
  ('STA-9-102', 'STA9102', 'STA', 'Adblu Protec ANTICRISTALIZANTE 1 L', 'Aditivo anticristalizante para sistemas AdBlue y SCR en formato 1 litro, para vehículo industrial y flotas.', 'IAM', 'taller', 46.20, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════════════════
  -- FAMILIA 3: Limpieza de DPF por inmersión (8 refs)
  -- ════════════════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('STA-10-800', 'STA10800', 'STA', 'Ceramic Clean+ Eliminador Carbonillas INMERSIÓN 10 L', 'Producto de inmersión para la limpieza de filtros de partículas DPF/FAP desmontados del vehículo. Elimina carbonilla y cenizas sin dañar el sustrato cerámico. Garrafa de 10 litros.', 'IAM', 'taller', 139.65, v_proveedor_id, v_proveedor_nombre),
  ('STA-1-190-N', 'STA1190N', 'STA', 'Útil de inmersión con equipación neumática', 'Útil de inmersión con equipación neumática para la limpieza de filtros de partículas DPF/FAP desmontados. Equipo profesional de taller.', 'IAM', 'taller', 261.93, v_proveedor_id, v_proveedor_nombre),
  ('STA-1-190-K', 'STA1190K', 'STA', 'Manga de aclarado con llave 1 m', 'Manga de aclarado con llave de 1 metro. Accesorio para el proceso de limpieza de filtros de partículas por inmersión.', 'IAM', 'taller', 27.34, v_proveedor_id, v_proveedor_nombre),
  ('STA-1-191-US', 'STA1191US', 'STA', 'Útil de soplado con llave de cierre', 'Útil de soplado con llave de cierre. Accesorio para el secado y soplado de filtros de partículas tras el aclarado.', 'IAM', 'taller', 28.57, v_proveedor_id, v_proveedor_nombre),
  ('STA-1-1000-KN', 'STA11000KN', 'STA', 'Kit neumático para contenedor 1000 litros', 'Kit neumático para contenedor de 1000 litros. Permite adaptar el sistema de limpieza a contenedores tipo GRG.', 'IAM', 'taller', 127.98, v_proveedor_id, v_proveedor_nombre),
  ('STA-1-220-AZ', 'STA1220AZ', 'STA', 'Útil de aclarado 220 L sin tapa boca ancha', 'Útil de aclarado de 220 litros sin tapa, boca ancha, para el aclarado de filtros de partículas tras el baño de inmersión.', 'IAM', 'taller', 375.93, v_proveedor_id, v_proveedor_nombre),
  ('STA-1-150-AZ', 'STA1150AZ', 'STA', 'Útil de aclarado 150 L sin tapa', 'Útil de aclarado de 150 litros sin tapa, para el aclarado de filtros de partículas tras el baño de inmersión.', 'IAM', 'taller', 363.46, v_proveedor_id, v_proveedor_nombre),
  ('STA-1-120-AZ', 'STA1120AZ', 'STA', 'Útil de aclarado 120 L sin tapa', 'Útil de aclarado de 120 litros sin tapa, para el aclarado de filtros de partículas tras el baño de inmersión.', 'IAM', 'taller', 355.82, v_proveedor_id, v_proveedor_nombre);

  -- ══════════════════════════════════════════════════
  -- FAMILIA 4: Tratamientos de combustible (5 refs)
  -- ══════════════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('STA-3-1203', 'STA31203', 'STA', 'Limpiador de inyectores y Pre ITV 1 L', 'Limpiador de inyectores y preparador pre-ITV. Limpia el circuito de inyección y reduce emisiones antes de la inspección técnica. Formato 1 litro.', 'IAM', 'taller', 25.28, v_proveedor_id, v_proveedor_nombre),
  ('STA-3-1010', 'STA31010', 'STA', 'Predator Diesel Biocida antibacterias gasoil 1 L', 'Biocida antibacterias para gasóleo. Elimina la contaminación microbiana en depósitos de gasoil y previene la obstrucción de filtros. Formato 1 litro.', 'IAM', 'taller', 28.00, v_proveedor_id, v_proveedor_nombre),
  ('STA-3-1002', 'STA31002', 'STA', 'Predator Diesel Biocida antibacterias gasoil 5 L', 'Biocida antibacterias para gasóleo en formato 5 litros, para depósitos de gran capacidad, flotas y maquinaria.', 'IAM', 'taller', 122.62, v_proveedor_id, v_proveedor_nombre),
  ('STA-3-1004', 'STA31004', 'STA', 'Antifreeze Diesel Anticongelante gasoil 1 L', 'Anticongelante para gasóleo. Evita la parafinación del gasoil a baja temperatura y asegura el arranque en invierno. Formato 1 litro.', 'IAM', 'taller', 20.64, v_proveedor_id, v_proveedor_nombre),
  ('STA-3-1006', 'STA31006', 'STA', 'Regenerator FAP Regenerador filtro partículas 1 L', 'Regenerador de filtro de partículas. Facilita la regeneración del FAP/DPF sin desmontar, reduciendo la acumulación de carbonilla. Formato 1 litro.', 'IAM', 'taller', 20.34, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 5: Radiadores (5 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('STA-41518', 'STA41518', 'STA', 'Alu-1000 Descarbonizador desengrasante 10 L', 'Descarbonizador y desengrasante Alu-1000 para la limpieza externa de radiadores e intercoolers. No ataca el aluminio. Garrafa de 10 litros.', 'IAM', 'taller', 72.19, v_proveedor_id, v_proveedor_nombre),
  ('STA-41519', 'STA41519', 'STA', 'Kit limpieza externa radiadores con pulverizador neumático', 'Kit de limpieza externa de radiadores con pulverizador neumático. Equipo completo para limpiar radiadores, intercoolers y condensadores sin desmontar.', 'IAM', 'taller', 401.40, v_proveedor_id, v_proveedor_nombre),
  ('STA-41544', 'STA41544', 'STA', 'Limpiador interno de radiadores 1 L', 'Limpiador interno de radiadores. Elimina cal, óxido y depósitos del circuito de refrigeración antes del cambio de anticongelante. Formato 1 litro.', 'IAM', 'taller', 26.60, v_proveedor_id, v_proveedor_nombre),
  ('STA-41540-L', 'STA41540L', 'STA', 'Espadín con enchufe rápido macho 1 m', 'Espadín con enchufe rápido macho de 1 metro. Accesorio de aplicación para el kit de limpieza externa de radiadores.', 'IAM', 'taller', 116.90, v_proveedor_id, v_proveedor_nombre),
  ('STA-41540-C', 'STA41540C', 'STA', 'Espadín con enchufe rápido macho 0,60 mm', 'Espadín con enchufe rápido macho de 0,60 mm. Accesorio de aplicación para zonas de acceso reducido en la limpieza de radiadores.', 'IAM', 'taller', 75.11, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 6: Químicos de taller (2 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('STA-41100', 'STA41100', 'STA', 'STA CHAIN PROTECT+ 400 ml', 'Lubricante protector de cadena STA CHAIN PROTECT+. Alta adherencia y resistencia a la proyección, para cadenas de moto y maquinaria. Aerosol de 400 ml.', 'IAM', 'taller', 18.87, v_proveedor_id, v_proveedor_nombre),
  ('STA-41006', 'STA41006', 'STA', 'Multilubricante Super Desgripante con antifricción 400 ml', 'Multilubricante super desgripante con tratamiento antifricción. Desbloquea, lubrica, protege del óxido y desplaza la humedad. Aerosol de 400 ml.', 'IAM', 'taller', 12.12, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 7: Limpieza e higiene (4 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('STA-41531', 'STA41531', 'STA', 'Champú profesional concentrado carrocerías 10 L', 'Champú profesional concentrado para el lavado de carrocerías. Alto poder detergente y secado sin marcas. Garrafa de 10 litros.', 'IAM', 'taller', 38.36, v_proveedor_id, v_proveedor_nombre),
  ('STA-41532', 'STA41532', 'STA', 'Champú profesional concentrado Plus carrocerías 10 L', 'Champú profesional concentrado Plus para el lavado de carrocerías, con mayor poder desengrasante y brillo. Garrafa de 10 litros.', 'IAM', 'taller', 47.32, v_proveedor_id, v_proveedor_nombre),
  ('STA-4128', 'STA4128', 'STA', 'Multiuso desengrasante CONCENTRADO 10 L', 'Multiuso desengrasante concentrado para taller. Diluible según necesidad, apto para suelos, motores, piezas y utillaje. Garrafa de 10 litros.', 'IAM', 'taller', 48.65, v_proveedor_id, v_proveedor_nombre),
  ('LA-21062', 'LA21062', 'STA', 'Toallitas lavamanos mecánico 72 unidades', 'Toallitas lavamanos para mecánico. Limpian grasa, aceite y suciedad sin agua, con acción hidratante. Bote de 72 unidades.', 'IAM', 'taller', 30.33, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 8: Electrónica (1 ref)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('RADAGO-EVO', 'RADAGOEVO', 'STA', 'RADAGO EVO detector de radar portátil', 'Detector de radar portátil de nueva generación con antena digital, perfil ES, base GPS y Bluetooth. Mayor rapidez de respuesta y más distancia de detección. Se instala y se retira sin herramientas.', 'IAM', 'taller', 547.23, v_proveedor_id, v_proveedor_nombre);

  RAISE NOTICE '✅ Importación STA completada: 32 productos insertados para proveedor %', v_proveedor_id;
END $$;

-- Verificar la importación
SELECT referencia, nombre, precio, marca
FROM piezas_publicadas
WHERE marca = 'STA'
ORDER BY referencia;
