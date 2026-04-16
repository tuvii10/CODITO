-- Restaurar datos verificados (abril 2026)
-- Corrige la corrupción del cron automático

DELETE FROM bank_promos;

INSERT INTO bank_promos (banco, icon, color, tarjeta, descuento, dias, supers, tope, nota) VALUES
  ('Banco Nación',    '🇦🇷', '#009cde', 'Visa',                    30, array['Miércoles'],         array['Changomás','Carrefour','Vea','Coto','Disco'],    '$12.000 por semana',   'Programa BNA+'),
  ('Santander',       '🔴',  '#ec0000', 'Visa / Mastercard',        25, array['Miércoles'],         array['Carrefour','Disco','Vea','Jumbo'],               '$20.000 por mes',      null),
  ('Galicia',         '🟠',  '#e95b0c', 'Visa / Mastercard',        25, array['Martes','Jueves'],   array['Jumbo'],                                        null,                   '30% con tarjeta Eminent'),
  ('BBVA',            '🔵',  '#004481', 'Visa / Mastercard',        25, array['Lunes'],             array['Carrefour'],                                    '$8.000 por semana',    null),
  ('HSBC',            '⬜',  '#db0011', 'Visa / Mastercard',        25, array['Jueves'],            array['Jumbo','Disco','Vea'],                          '$15.000 por mes',      'Reintegro en cuenta'),
  ('Banco Macro',     '🟡',  '#f5b400', 'Visa / Mastercard',        20, array['Jueves'],            array['Disco','Vea','Makro'],                          null,                   null),
  ('Banco Provincia', '🏦',  '#0057a8', 'Cuenta DNI / Mastercard',  15, array['Martes'],            array['Carrefour','Changomás'],                        null,                   'Solo provincia de Buenos Aires'),
  ('Naranja X',       '🍊',  '#ff6a00', 'Naranja Visa',             20, array['Viernes'],           array['Carrefour','Día'],                              null,                   null),
  ('MODO',            '💳',  '#6c11e8', 'Múltiples bancos',         30, array['Miércoles'],         array['Disco','Vea','La Anónima','Día'],               null,                   '20% Viernes a Domingo'),
  ('Uala',            '💜',  '#7b2d8b', 'Mastercard Prepaga',       25, array['Lunes'],             array['Coto','Día'],                                   null,                   null),
  ('Mercado Pago',    '💙',  '#009ee3', 'Tarjeta MP / QR',          25, array['Siempre'],           array['Coto','Carrefour','Carrefour Maxi','Jumbo','Disco','Vea','Día','Changomás'], null, 'Verificar descuento activo en la app'),
  ('Personal Pay',    '🟢',  '#00a550', 'Visa Prepaga',             25, array['Jueves','Viernes'],  array['Diarco','Día','Changomás','Makro','Maxiconsumo'],null,                   'Requiere nivel 2 en la app'),
  ('Brubank',         '🟣',  '#6a0dad', 'Visa Débito',              30, array['Jueves'],            array['Coto'],                                         null,                   'Pago con NFC contactless');
