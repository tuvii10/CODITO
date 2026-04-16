-- Datos verificados abril 2026
-- Fuentes: iProfesional, El Observador, Radio Fueguina, El Destape, Sitios Argentina, Infozona

DELETE FROM bank_promos;

INSERT INTO bank_promos (banco, icon, color, tarjeta, descuento, dias, supers, tope, nota) VALUES

  -- MIÉRCOLES
  ('Banco Nación',    '🇦🇷', '#009cde', 'Visa / Mastercard',        30, array['Miércoles'],              array['ChangoMás','Carrefour','Vea','Coto','Disco'],         '$12.000 por semana',  'Requiere pagar con MODO + QR. Programa BNA+.'),
  ('MODO',            '💳',  '#6c11e8', 'Múltiples bancos',          20, array['Siempre'],                array['Disco','Vea','La Anónima','DIA'],                     null,                  'Reintegro en cuenta. El tope varía según el banco emisor.'),
  ('Banco Patagonia', '🏔️', '#2563eb', 'Cuentasueldo',              35, array['Miércoles'],              array['Carrefour'],                                         null,                  'Solo para clientes con plan sueldo singular.'),

  -- MARTES
  ('Banco Macro',     '🟡',  '#f5b400', 'Visa / Mastercard',         20, array['Martes','Jueves'],        array['Coto'],                                              '$25.000 por mes',     'Pago con MODO. Mínimo de compra $60.000.'),
  ('Naranja X',       '🍊',  '#ff6a00', 'Naranja Visa',              25, array['Martes'],                 array['ChangoMás'],                                         '$15.000 por semana',  'Plan Turbo. Plan Épico: 30%. La intensidad varía según el plan.'),

  -- VIERNES
  ('BBVA',            '🔵',  '#004481', 'Visa / Mastercard',         30, array['Viernes'],                array['Carrefour'],                                         '$15.000 por mes',     null),

  -- CUENTA DNI (múltiples días)
  ('Cuenta DNI',      '🏦',  '#0057a8', 'Cuenta DNI (Banco Provincia)', 30, array['Lunes','Miércoles','Jueves'], array['Día','Carrefour','La Anónima','ChangoMás','Coto'], '$15.000 por mes', 'Lun 10% Día · Mié 10% Carrefour/La Anónima · Jue 20% ChangoMás · Jue 30% Coto (NFC).'),

  -- SIEMPRE
  ('Mercado Pago',    '💙',  '#009ee3', 'Tarjeta MP / QR',           25, array['Siempre'],                array['Carrefour','Coto','Día','Vea','ChangoMás'],           null,                  'Sin tope en la mayoría de casos. Verificar descuento activo en la app.');
