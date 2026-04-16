-- Restaurar datos verificados (abril 2026)
-- Incluye correcciones y nuevos bancos agregados manualmente

DELETE FROM bank_promos;

INSERT INTO bank_promos (banco, icon, color, tarjeta, descuento, dias, supers, tope, nota) VALUES
  -- LUNES
  ('Banco Provincia', '🏦',  '#0057a8', 'Cuenta DNI / Mastercard',  20, array['Lunes','Martes'],    array['Día','Carrefour','Changomás'],                   '$8.000 por día',       'Lunes 20% en Día. Martes 15% en mayoristas seleccionados.'),
  ('Uala',            '💜',  '#7b2d8b', 'Mastercard Prepaga',        25, array['Lunes'],             array['Coto','Día'],                                   null,                   null),
  ('BBVA',            '🔵',  '#004481', 'Visa / Mastercard',         25, array['Lunes'],             array['Carrefour'],                                    '$8.000 por semana',    null),

  -- MARTES
  ('Supervielle',     '🟦',  '#0071ce', 'Visa / Mastercard',         20, array['Martes'],            array['Jumbo','Disco','Vea','Changomás'],               '$25.000 por mes',      null),
  ('Galicia',         '🟠',  '#e95b0c', 'Visa / Mastercard',         25, array['Martes','Jueves'],   array['Jumbo'],                                        null,                   '30% con tarjeta Eminent'),

  -- MIÉRCOLES
  ('Banco Nación',    '🇦🇷', '#009cde', 'Visa',                     30, array['Miércoles'],         array['Changomás','Carrefour','Vea','Coto','Disco'],    '$12.000 por semana',   'Programa BNA+'),
  ('Santander',       '🔴',  '#ec0000', 'Visa / Mastercard',         25, array['Miércoles'],         array['Carrefour','Disco','Vea','Jumbo'],               '$20.000 por mes',      null),
  ('MODO',            '💳',  '#6c11e8', 'Múltiples bancos',          30, array['Miércoles'],         array['Disco','Vea','La Anónima','Día'],                null,                   '20% Viernes a Domingo con MODO'),

  -- JUEVES
  ('HSBC',            '⬜',  '#db0011', 'Visa / Mastercard',         25, array['Jueves'],            array['Jumbo','Disco','Vea'],                          '$15.000 por mes',      'Reintegro en cuenta'),
  ('Banco Macro',     '🟡',  '#f5b400', 'Visa / Mastercard',         20, array['Jueves'],            array['Disco','Vea','Makro'],                          null,                   null),
  ('Personal Pay',    '🟢',  '#00a550', 'Visa Prepaga',              25, array['Jueves','Viernes'],  array['Diarco','Día','Changomás','Makro','Maxiconsumo'],null,                   'Requiere nivel 2 en la app'),
  ('ICBC',            '🔷',  '#1a5fa8', 'Visa / Mastercard',         20, array['Jueves'],            array['Carrefour','Disco','Jumbo'],                    '$10.000 por mes',      null),

  -- VIERNES
  ('Naranja X',       '🍊',  '#ff6a00', 'Naranja Visa',              20, array['Viernes'],           array['Carrefour','Día'],                              null,                   '3 cuotas sin interés en supermercados seleccionados'),

  -- SIEMPRE
  ('Mercado Pago',    '💙',  '#009ee3', 'Tarjeta MP / QR',           25, array['Siempre'],           array['Coto','Carrefour','Carrefour Maxi','Jumbo','Disco','Vea','Día','Changomás'], null, 'Verificar descuento activo en la app');
