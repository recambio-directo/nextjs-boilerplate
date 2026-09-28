-- ══════════════════════════════════════════════════════════════
-- IMPORTACIÓN CATÁLOGO FERVE 2026 - Cargadores, Boosters y Equipos
-- 80+ referencias, 12 familias
-- SIN PRECIOS (catálogo técnico) - precio = 0
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_proveedor_id UUID;
  v_proveedor_nombre TEXT;
BEGIN
  SELECT id INTO v_proveedor_id FROM auth.users WHERE email = 'vicente@rgranvia.es';

  SELECT COALESCE(raw_user_meta_data->>'nombre', raw_user_meta_data->>'full_name', 'Granvia Automoción')
  INTO v_proveedor_nombre
  FROM auth.users WHERE id = v_proveedor_id;

  -- Eliminar productos FERVE anteriores si los hubiera
  DELETE FROM piezas_publicadas
  WHERE proveedor_id = v_proveedor_id
    AND marca = 'FERVE';

  -- ════════════════════════════════════════
  -- FAMILIA 1: Cargadores HF (5 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-2201', 'F2201', 'FERVE', 'Cargador HF 6/12V 100W', 'Cargador de alta frecuencia 6/12V, 100W. Automático con microprocesador. Para baterías de plomo-ácido LIQ, GEL, AGM. Carga estabilizada RF. Dimensiones 150x90x55mm, 0.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2505', 'F2505', 'FERVE', 'Cargador HF 12V 350W', 'Cargador de alta frecuencia 12V, 350W. Automático con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop. Carga estabilizada RF. Dimensiones 200x110x65mm, 1.050kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2507', 'F2507', 'FERVE', 'Cargador HF 12/24V 500W', 'Cargador de alta frecuencia 12/24V, 500W. Automático con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Carga estabilizada RF. Dimensiones 200x110x65mm, 1.100kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2520', 'F2520', 'FERVE', 'Cargador HF 12V 1400W', 'Cargador de alta frecuencia 12V, 1400W. Automático con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Fuente de alimentación. Dimensiones 330x260x100mm, 4.800kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2525', 'F2525', 'FERVE', 'Cargador HF 12/24V 1800W', 'Cargador de alta frecuencia 12/24V, 1800W. Automático con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Fuente de alimentación. Dimensiones 330x260x100mm, 5.200kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 2: Cargadores HF PLUS (4 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-2805', 'F2805', 'FERVE', 'Cargador HF PLUS 12V 350W', 'Cargador HF PLUS 12V, 350W. Automático con microprocesador y reinicio de carga. Para baterías LIQ, GEL, AGM, Start-Stop, EFB, Lithium. Carga estabilizada RF. Dimensiones 200x110x65mm, 1.100kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2810', 'F2810', 'FERVE', 'Cargador HF PLUS 12V 700W', 'Cargador HF PLUS 12V, 700W. Automático con microprocesador y reinicio de carga. Para baterías LIQ, GEL, AGM, Start-Stop, EFB, Lithium. Carga estabilizada RF. Dimensiones 200x110x65mm, 1.200kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2815', 'F2815', 'FERVE', 'Cargador HF PLUS 12V 1050W', 'Cargador HF PLUS 12V, 1050W. Automático con microprocesador y reinicio de carga. Para baterías LIQ, GEL, AGM, Start-Stop, EFB, Lithium. Carga estabilizada RF. Dimensiones 200x110x65mm, 1.400kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2820', 'F2820', 'FERVE', 'Cargador HF PLUS 12/24V 1400W', 'Cargador HF PLUS 12/24V, 1400W. Automático con microprocesador y reinicio de carga. Para baterías LIQ, GEL, AGM, Start-Stop, EFB, Lithium. Carga estabilizada RF. Dimensiones 275x160x80mm, 2.100kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 3: Cargadores HF PRO (4 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-9012', 'F9012', 'FERVE', 'Cargador HF PRO 12V 850W', 'Cargador profesional HF PRO 12V, 850W. Automático con microprocesador. Para baterías LIQ, GEL, AGM. Carga estabilizada RF. Con asa de transporte. Dimensiones 275x160x80mm, 2.200kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-9030', 'F9030', 'FERVE', 'Cargador HF PRO 12/24V 2100W', 'Cargador profesional HF PRO 12/24V, 2100W. Automático con microprocesador. Para baterías LIQ, GEL, AGM. Carga estabilizada RF. Con asa de transporte. Dimensiones 275x160x80mm, 2.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-9100', 'F9100', 'FERVE', 'Cargador HF PRO 12/24V 7200W', 'Cargador profesional HF PRO 12/24V, 7200W. Automático con microprocesador. Para baterías LIQ, GEL, AGM. Carga estabilizada RF. Caja metálica resistente. Dimensiones 420x250x220mm, 10.400kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-9124', 'F9124', 'FERVE', 'Cargador HF PRO 12/24V 8600W', 'Cargador profesional HF PRO 12/24V, 8600W. Automático con microprocesador. Para baterías LIQ, GEL, AGM. Carga estabilizada RF. Caja metálica resistente. Dimensiones 420x250x220mm, 12.100kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 4: Cargadores PRIMA (10 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-705', 'F705', 'FERVE', 'Cargador PRIMA 6/12V', 'Cargador convencional PRIMA 6/12V. Carga manual. Para baterías de plomo-ácido LIQ. Amperímetro analógico. Dimensiones 210x140x150mm, 2.600kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-903', 'F903', 'FERVE', 'Cargador PRIMA 12V', 'Cargador convencional PRIMA 12V. Carga manual. Para baterías de plomo-ácido LIQ. Amperímetro analógico. Dimensiones 210x140x150mm, 2.700kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-905', 'F905', 'FERVE', 'Cargador PRIMA 12V', 'Cargador convencional PRIMA 12V. Carga manual. Para baterías de plomo-ácido LIQ, GEL. Amperímetro analógico. Dimensiones 250x165x160mm, 4.100kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-805', 'F805', 'FERVE', 'Cargador PRIMA 12V automático', 'Cargador PRIMA 12V con carga automática. Para baterías de plomo-ácido LIQ, GEL. Visor electrónico. Dimensiones 250x165x160mm, 4.200kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-806', 'F806', 'FERVE', 'Cargador PRIMA 12V automático', 'Cargador PRIMA 12V con carga automática. Para baterías de plomo-ácido LIQ, GEL, AGM. Visor electrónico. Dimensiones 250x165x160mm, 4.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-807', 'F807', 'FERVE', 'Cargador PRIMA 12V automático', 'Cargador PRIMA 12V con carga automática. Para baterías de plomo-ácido LIQ, GEL, AGM. Visor electrónico. Caja metálica. Dimensiones 285x200x180mm, 6.900kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-811', 'F811', 'FERVE', 'Cargador PRIMA 12V automático', 'Cargador PRIMA 12V con carga automática y fuente de alimentación. Para baterías LIQ, GEL, AGM. Caja metálica. Dimensiones 285x200x180mm, 7.700kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-812', 'F812', 'FERVE', 'Cargador PRIMA 12/24V automático', 'Cargador PRIMA 12/24V con carga automática y fuente de alimentación. Para baterías LIQ, GEL, AGM. Caja metálica. Dimensiones 285x200x180mm, 7.800kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-915', 'F915', 'FERVE', 'Cargador PRIMA 12V con ruedas', 'Cargador PRIMA 12V con carga automática. Para baterías LIQ, GEL, AGM. Con ruedas para taller. Caja metálica. Dimensiones 560x320x440mm, 22.000kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-918', 'F918', 'FERVE', 'Cargador PRIMA 12/24V con ruedas', 'Cargador PRIMA 12/24V con carga automática. Para baterías LIQ, GEL, AGM. Con ruedas para taller. Caja metálica. Dimensiones 560x320x440mm, 23.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 5: Cargadores AUTOMATIC (4 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-968', 'F968', 'FERVE', 'Cargador AUTOMATIC 6/12V', 'Cargador automático 6/12V con microprocesador. Para baterías LIQ, GEL, AGM. Visor LCD. Dimensiones 175x90x55mm, 0.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-908', 'F908', 'FERVE', 'Cargador AUTOMATIC 12V', 'Cargador automático 12V con microprocesador. Para baterías LIQ, GEL, AGM. Visor LCD. Dimensiones 175x90x55mm, 0.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-909', 'F909', 'FERVE', 'Cargador AUTOMATIC 12V', 'Cargador automático 12V con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop. Visor LCD. Dimensiones 225x135x65mm, 0.800kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2320', 'F2320', 'FERVE', 'Cargador AUTOMATIC 12/24V', 'Cargador automático 12/24V con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop. Visor LCD. Dimensiones 225x135x65mm, 0.800kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 6: Cargadores TETRA (5 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-2908', 'F2908', 'FERVE', 'Cargador TETRA 12V', 'Cargador TETRA 12V con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Visor LCD con estado de carga. Dimensiones 200x110x65mm, 0.900kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2914', 'F2914', 'FERVE', 'Cargador TETRA 12/24V', 'Cargador TETRA 12/24V con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Visor LCD. Dimensiones 200x110x65mm, 0.950kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2916', 'F2916', 'FERVE', 'Cargador TETRA 12/24V', 'Cargador TETRA 12/24V con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Con reinicio de carga. Visor LCD. Dimensiones 275x160x80mm, 1.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2920', 'F2920', 'FERVE', 'Cargador TETRA 12/24V', 'Cargador TETRA 12/24V con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Con reinicio de carga y fuente alimentación. Visor LCD. Dimensiones 275x160x80mm, 1.800kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2930', 'F2930', 'FERVE', 'Cargador TETRA 12/24V', 'Cargador TETRA 12/24V con microprocesador. Para baterías LIQ, GEL, AGM, Start-Stop, EFB. Con reinicio de carga y fuente alimentación. Visor LCD. Dimensiones 330x260x100mm, 3.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 7: Cargadores FAST (4 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-925', 'F925', 'FERVE', 'Cargador rápido FAST 12/24V 1500W con booster 250A', 'Cargador rápido y booster FAST 12/24V, 1500W. 8 funciones: verificación polaridad, estado batería, alternador, carga normal/rápida/manual/automática, booster 250A. Dimensiones 420x910x255mm, 23.900kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-925RF', 'F925RF', 'FERVE', 'Cargador rápido FAST RF 12/24V 1500W con booster 250A', 'Cargador rápido y booster FAST 12/24V, 1500W. Versión RF (Ripple Free). 8 funciones con booster 250A. Con microprocesador. Dimensiones 420x910x255mm, 24.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-970', 'F970', 'FERVE', 'Cargador rápido FAST 12/24V 2300W con booster 450A', 'Cargador rápido y booster FAST 12/24V, 2300W. 8 funciones con booster 450A. Con power booster y cable de 4m. Dimensiones 420x910x255mm, 27.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-970RF', 'F970RF', 'FERVE', 'Cargador rápido FAST RF 12/24V 2300W con booster 450A', 'Cargador rápido y booster FAST 12/24V, 2300W. Versión RF (Ripple Free). 8 funciones con booster 450A. Con power booster y cable de 4m. Dimensiones 420x910x255mm, 28.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 8: Boosters portátiles (10 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-505', 'F505', 'FERVE', 'Booster Box 12V 400A Lithium 18000mAh', 'Arrancador portátil de litio 12V. 400A arranque, 800A pico. Batería interna 18000mAh. Con cargador USB 5V. Dimensiones 227x29x95mm, 0.650kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-580', 'F580', 'FERVE', 'Booster 12-24V Lithium 24000mAh', 'Arrancador multifunción portátil 12/24V. 600A(12V)/400A(24V) arranque, 1200A/900A pico. Batería litio 24000mAh. Con USB 5V 2.1A y LED 8h. Dimensiones 232x230x120mm, 1.850kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-590', 'F590', 'FERVE', 'Booster THE BIG ONE 12-24V Lithium 54000mAh', 'Arrancador portátil de máxima potencia 12/24V. 1500A(12V)/900A(24V) arranque, 3000A/1800A pico. Batería litio 54000mAh. Con USB 5V 2.4A y DC 12V 8A. NUEVO. Dimensiones 300x300x150mm, 3.850kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-515', 'F515', 'FERVE', 'EDLC Booster 12V 500A Supercondensadores', 'Arrancador sin batería interna con supercondensadores EDLC 500F. 12V 500A, pico 1100A. Se recarga en 3 minutos con la batería del vehículo. IP65. +500.000 ciclos. Dimensiones 220x118x50mm, 1.100kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1900', 'F1900', 'FERVE', 'Booster 12V 400A con batería AGM', 'Arrancador profesional 12V 400A, pico 1000A. Batería interna AGM 12V 19Ah. Con cable de 0.6m. Caja metálica resistente. Dimensiones 265x270x110mm, 9.350kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2000', 'F2000', 'FERVE', 'Booster 12V 400A con batería AGM', 'Arrancador profesional 12V 400A, pico 1000A. Batería interna AGM 12V 19Ah. Con cable de 1.15m. Caja metálica resistente con asa. Dimensiones 220x380x170mm, 10.480kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2001', 'F2001', 'FERVE', 'Booster 12V 600A con batería AGM', 'Arrancador profesional 12V 600A, pico 1500A. Batería interna AGM 12V 27Ah. Con cable de 1.15m. Caja metálica resistente con asa. Dimensiones 220x380x170mm, 14.700kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2101', 'F2101', 'FERVE', 'Booster 12V 600A con baterías Genesis', 'Arrancador profesional 12V 600A, pico 1500A. Baterías internas Genesis AGM 16Ah. Con cable de 1.15m. Caja metálica resistente con asa. Dimensiones 220x380x170mm, 10.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2124', 'F2124', 'FERVE', 'Booster 12/24V 1200A/600A con baterías Genesis', 'Arrancador profesional 12/24V. 1200A(12V)/600A(24V), pico 3000A/1500A. 2 baterías Genesis AGM 16Ah. Con cable de 1.65m y cargador automático 12V 5A integrado. Dimensiones 430x820x260mm, 26.500kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2125', 'F2125', 'FERVE', 'Booster 12/24V 2400A/1200A con baterías Genesis', 'Arrancador profesional de máxima potencia 12/24V. 2400A(12V)/1200A(24V), pico 6000A/3000A. 4 baterías Genesis AGM 16Ah. Con cable de 3m y cargador automático integrado. Dimensiones 430x820x260mm, 40.200kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 9: Testers (7 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-814', 'F814', 'FERVE', 'Comprobador de baterías 12V 250A', 'Comprobador de baterías con descarga de 250A. Indicador digital de precisión 0.01V. Para baterías 12V 32-180Ah. Test batería, alternador. Caja metálica. Dimensiones 250x145x210mm, 3.350kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1830', 'F1830', 'FERVE', 'Multímetro digital 600V CAT III', 'Multímetro digital 600V CAT III. Funciones: DC/AC Volts, DC Amps, Resistencia, Diodo, Continuidad. Dimensiones 138x69x31mm, 300g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1880', 'F1880', 'FERVE', 'Multímetro/Pinza amperimétrica 1000V CAT IV', 'Multímetro y pinza amperimétrica 1000V CAT IV / 600V CAT IV. Con PC-Link y USB. Funciones: DC/AC Volts, DC/AC Amps, Resistencia, Capacitancia, Frecuencia, Temperatura, Diodo, Continuidad, Duty cycle. Dimensiones 190x90x48mm, 660g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1902', 'F1902', 'FERVE', 'Analizador de baterías digital 12V', 'Analizador de baterías digital 12V. Test batería (10-200Ah), arranque y sistema de carga. Normas SAE, EN, IEC, DIN, CA. Dimensiones 119x68x19mm, 180g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1810', 'F1810', 'FERVE', 'Analizador de baterías y sistema eléctrico 12/24V', 'Analizador de baterías y sistema eléctrico 12/24V. Test batería (6-300Ah), arranque y sistema de carga. Normas CCA/SAE, JIS, EN, IEC, DIN, CA/MCA. Dimensiones 235x100x70mm, 715g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1707', 'F1707', 'FERVE', 'Pinza amperimétrica 1000V CAT II', 'Pinza amperimétrica 1000V CAT II / 600V CAT III. Funciones: DC/AC Amps, DC/AC Volts, Resistencia, Capacitancia, Frecuencia, Temperatura, Diodo, Continuidad. Dimensiones 250x100x44mm, 450g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1708', 'F1708', 'FERVE', 'Pinza amperimétrica 600V CAT III', 'Pinza amperimétrica 600V CAT III con LED. Funciones: DC/AC Amps, DC/AC Volts, Resistencia, Capacitancia, Frecuencia, Diodo, Continuidad, NCV. Dimensiones 218x80x30mm, 400g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 10: Circuit Test (8 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-416-12V', 'F41612V', 'FERVE', 'Comprobador de circuitos 12V', 'Comprobador de circuitos tipo lápiz 12V. Indicador LED. Dimensiones 140mm Ø15mm, 25g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-416-24V', 'F41624V', 'FERVE', 'Comprobador de circuitos 24V', 'Comprobador de circuitos tipo lápiz 24V. Indicador LED. Dimensiones 140mm Ø15mm, 25g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-30', 'F30', 'FERVE', 'Comprobador de circuitos 2.8-48V', 'Comprobador de circuitos multivoltaje 2.8V a 48V (6 rangos). Indicadores LED por tensión. Dimensiones 160x22x16mm, 30g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-91', 'F91', 'FERVE', 'Comprobador de circuitos 12/13V', 'Comprobador de circuitos 12/13V con indicadores LED. Dimensiones 160x22x16mm, 30g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-916', 'F916', 'FERVE', 'Comprobador de circuitos 6/12/24V', 'Comprobador de circuitos 6V, 12V y 24V con indicadores LED. Dimensiones 160x22x16mm, 30g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-85', 'F85', 'FERVE', 'Comprobador de baterías 12/13V con pinzas', 'Comprobador de baterías y alternador 12/13V con pinzas. Indicadores LED. Dimensiones 120x23x15mm, 180g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-90', 'F90', 'FERVE', 'Comprobador de circuitos 12/24V', 'Comprobador de circuitos 12V y 24V. Con indicadores LED para batería y alternador. Dimensiones 160x43x15mm, 125g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-2200', 'F2200', 'FERVE', 'Comprobador digital de circuitos 12/24V', 'Comprobador digital de circuitos 12/24V. Resolución 0.1V. Con indicadores LED. Dimensiones 180x30x18mm, 70g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 11: Pinzas de batería (11 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-410B', 'F410B', 'FERVE', 'Pinzas de batería 25A (blister par)', 'Par de pinzas de batería 25A en blister. Apertura 25mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-427B', 'F427B', 'FERVE', 'Pinzas de batería 75A (blister par)', 'Par de pinzas de batería 75A en blister. Apertura 55mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-435B', 'F435B', 'FERVE', 'Pinzas de batería 150A (blister par)', 'Par de pinzas de batería 150A en blister. Apertura 88mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-444B', 'F444B', 'FERVE', 'Pinzas de batería 200A (blister par)', 'Par de pinzas de batería 200A en blister. Apertura 125mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-600B', 'F600B', 'FERVE', 'Pinzas de batería 600A (blister par)', 'Par de pinzas de batería 600A en blister. Apertura 135mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-402', 'F402', 'FERVE', 'Pinzas de batería 10A (10 unidades)', 'Juego de 10 pinzas de batería 10A. Apertura 25mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-410', 'F410', 'FERVE', 'Pinzas de batería 25A (10 unidades)', 'Juego de 10 pinzas de batería 25A. Apertura 55mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-427', 'F427', 'FERVE', 'Pinzas de batería 75A (10 unidades)', 'Juego de 10 pinzas de batería 75A. Apertura 90mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-435', 'F435', 'FERVE', 'Pinzas de batería 150A', 'Pinzas de batería 150A. Apertura 88mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-444', 'F444', 'FERVE', 'Pinzas de batería 200A', 'Pinzas de batería 200A. Apertura 125mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-600', 'F600', 'FERVE', 'Pinzas de batería 600A', 'Pinzas de batería 600A. Apertura 135mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 12: Accesorios (18 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-1', 'F1', 'FERVE', 'Cargador USB 12/24V DC', 'Cargador USB para mechero 12/24V DC. Salida 5V 1A. Para smartphone, tablet, MP3. Dimensiones 56x23x23mm, 10g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-438', 'F438', 'FERVE', 'Botella automática de llenado 1 litro', 'Botella automática de llenado para baterías. Capacidad 1 litro. Dimensiones 225x100mm, 100g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-432', 'F432', 'FERVE', 'Limpiabornes y terminales', 'Limpiador de bornes y conectores de batería. Dimensiones 130x110x30mm, 140g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-425', 'F425', 'FERVE', 'Densímetro de alta precisión', 'Densímetro de alta precisión para electrolito de baterías. Dimensiones 245mm, 30g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-425C', 'F425C', 'FERVE', 'Densímetro de alta precisión', 'Densímetro de alta precisión para electrolito de baterías. Con escala de colores. Dimensiones 250x32x32mm, 50g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-211', 'F211', 'FERVE', 'Conector para cargadores HF/HF PLUS', 'Conector de conexión rápida para cargadores F-2201, F-2505, F-2507 (12-24V), F-9012, F-2805, F-2810. Cable 300mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-213', 'F213', 'FERVE', 'Conector para boosters F-1900/F-2000/F-2001/F-2101', 'Conector de conexión para arrancadores F-1900, F-2000, F-2001, F-2101. Cable 1.34m.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-502', 'F502', 'FERVE', 'Conector salvamemorias OBDII para F-505', 'Conector salvamemorias OBDII para booster F-505. Mantiene la memoria del vehículo durante el cambio de batería. Cable 490mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-222', 'F222', 'FERVE', 'Cable accesorio para cargadores', 'Cable accesorio de conexión para cargadores F-2201, F-2505, F-2507 (12-24V), F-9012, F-2805, F-2810. Longitud 1.5m.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-216', 'F216', 'FERVE', 'Conector para cargadores (anilla)', 'Conector con terminales de anilla para cargadores F-2201, F-2505, F-2507, F-9012, F-2805, F-2810. Cable 400mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-217', 'F217', 'FERVE', 'Conector para cargadores (pinzas)', 'Conector con pinzas para cargadores F-2201, F-2505, F-2507, F-9012, F-2805, F-2810. Cable 630mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-1822', 'F1822', 'FERVE', 'Conector para testers F-1830/F-1880/F-1707/F-1708', 'Conector de conexión para testers y multímetros F-1830, F-1880, F-1707, F-1708. Cable 700mm.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-205', 'F205', 'FERVE', 'Cable accesorio para F-9100/F-9124', 'Cable accesorio de conexión para cargadores profesionales F-9100 y F-9124. Sección 16mm². Longitud 5m. Peso 2.5kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-235', 'F235', 'FERVE', 'Cable accesorio para F-9100/F-9124', 'Cable accesorio de conexión para cargadores profesionales F-9100 y F-9124. Sección 16mm². Longitud 3.5m. Peso 1.45kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-219', 'F219', 'FERVE', 'Cargador automático 12V 2A para boosters', 'Cargador automático 12V 2A para recargar boosters F-1900, F-2000, F-2001, F-2101. Entrada 100-240V 50/60Hz 30W. Carga estabilizada RF. Dimensiones 110x48x32mm, 145g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-224', 'F224', 'FERVE', 'Cargador manual 24V 1.4A', 'Cargador manual 24V 1.4A para baterías LIQ. Entrada 230V 50/60Hz 45W. Carga estabilizada RF. Dimensiones 89x67x56mm, 990g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-251', 'F251', 'FERVE', 'Cargador para booster F-505', 'Cargador adaptador 14V 1A para booster F-505. Entrada 100-240V 50/60Hz 20W.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-280', 'F280', 'FERVE', 'Cargador para boosters F-580/F-590', 'Cargador adaptador 13.8V 2A para boosters F-580 y F-590. Entrada 100-240V 50/60Hz 30W.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- ════════════════════════════════════════
  -- FAMILIA 13: Cables Roll-Flex (4 refs)
  -- ════════════════════════════════════════
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-540', 'F540', 'FERVE', 'Cables de emergencia Roll-Flex 150A 2.5m', 'Cables de emergencia (puente) Roll-Flex 150A. Sección 16mm². Longitud 2.5m. Pinzas CCA cobre-aluminio. Peso 1.050kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-440', 'F440', 'FERVE', 'Cables de emergencia Roll-Flex 220A 3m', 'Cables de emergencia (puente) Roll-Flex 220A. Sección 25mm². Longitud 3m. Pinzas CCA cobre-aluminio. Peso 1.390kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-945', 'F945', 'FERVE', 'Cables de emergencia Roll-Flex 220A 4.5m', 'Cables de emergencia (puente) Roll-Flex 220A. Sección 25mm². Longitud 4.5m. Pinzas CCA cobre-aluminio. Peso 1.900kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-950', 'F950', 'FERVE', 'Cables de emergencia Roll-Flex 350A 5m', 'Cables de emergencia (puente) Roll-Flex 350A. Sección 40mm². Longitud 5m. Pinzas CCA cobre-aluminio. Peso 3.400kg.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  -- Conector test Pic (refs F-300 a F-306 y F-95/4)
  INSERT INTO piezas_publicadas (referencia, referencia_normalizada, marca, nombre, descripcion, tipo, tipo_vendedor, precio, proveedor_id, proveedor_nombre) VALUES
  ('F-95/4', 'F954', 'FERVE', 'Conector test FERVE Pic x4', 'Juego de 4 conectores test FERVE Pic. Dimensiones 110x150mm, 60g.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre),
  ('F-260', 'F260', 'FERVE', 'Cargador para booster F-560', 'Cargador adaptador 14V 1A para booster F-560. Entrada 100-240V 50/60Hz 20W.', 'IAM', 'taller', 0, v_proveedor_id, v_proveedor_nombre);

  RAISE NOTICE '✅ Importación FERVE completada. Total: % productos insertados.',
    (SELECT COUNT(*) FROM piezas_publicadas WHERE proveedor_id = v_proveedor_id AND marca = 'FERVE');
END $$;

-- Verificar la importación
SELECT marca, COUNT(*) as total, MIN(referencia) as primera_ref, MAX(referencia) as ultima_ref
FROM piezas_publicadas
WHERE marca = 'FERVE'
GROUP BY marca;
