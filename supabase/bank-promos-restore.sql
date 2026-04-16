-- Datos verificados abril 2026
-- Fuentes: El Observador, Radio Fueguina, iProfesional, Sitios Argentina, El Destape

DELETE FROM bank_promos;

INSERT INTO bank_promos (banco, icon, color, tarjeta, descuento, dias, supers, tope, nota) VALUES

  -- BANCO NACIÓN — 30% miércoles en Carrefour/ChangoMás con MODO BNA+
  ('Banco Nación', '🇦🇷', '#009cde', 'Visa / Mastercard',
   30, array['Miércoles'],
   array['Carrefour','ChangoMás'],
   '$12.000 por semana',
   'Requiere MODO BNA+ con QR. También 5% Lun-Vie en Día (tope $5.000/semana).'),

  -- BANCO MACRO — 20% martes en varios supers
  ('Banco Macro', '🟡', '#f5b400', 'Visa / Mastercard',
   20, array['Martes','Jueves'],
   array['Coto','Vea','Jumbo','Disco','ChangoMás'],
   '$25.000 por mes',
   'Martes: Coto, Vea, Jumbo, Disco. Jueves: Vea, Jumbo, Disco. Mínimo $60.000 en Coto. También 20% Vie-Sáb en Día.'),

  -- NARANJA X — 25% martes (Plan Turbo), 30% martes ChangoMás (Plan Épico)
  ('Naranja X', '🍊', '#ff6a00', 'Naranja Visa',
   25, array['Martes'],
   array['Coto','Carrefour','ChangoMás','Día'],
   '$12.000 por semana',
   'Plan Turbo: 25% en Coto, Carrefour y Día. Plan Épico: 30% en ChangoMás (tope $15.000/semana).'),

  -- SANTANDER — 20% martes en Coto
  ('Santander', '🔴', '#ec0000', 'Visa / Mastercard',
   20, array['Martes'],
   array['Coto'],
   '$25.000 por mes',
   'Mínimo de compra $60.000. Pago con MODO QR o tarjeta.'),

  -- BANCO PATAGONIA — 35% miércoles en Carrefour (Platinum)
  ('Banco Patagonia', '🏔️', '#2563eb', 'Visa / Mastercard',
   35, array['Miércoles','Sábado'],
   array['Carrefour','Vea','Jumbo'],
   '$25.000 por mes',
   'Miércoles 35% en Carrefour (tarjetas Platinum). Sábados 30% en Vea/Jumbo (tope $15.000/mes).'),

  -- MODO — 20% en Disco, Vea, La Anónima, DÍA
  ('MODO', '💳', '#6c11e8', 'Múltiples bancos',
   20, array['Martes','Jueves'],
   array['Disco','Vea','La Anónima','Día'],
   NULL,
   'Martes/Jueves 20% en Disco y Vea (mín $100.000, tope $25.000/mes). 20% en La Anónima y Día. El tope varía según banco emisor.'),

  -- MERCADO PAGO — 15% fin de semana en ChangoMás, 10% otros días
  ('Mercado Pago', '💙', '#009ee3', 'Tarjeta MP / QR',
   15, array['Viernes','Sábado','Domingo'],
   array['ChangoMás','Carrefour','Día'],
   NULL,
   'Vie-Dom 15% en ChangoMás (QR). Lun/Vie 10% en Carrefour. Miércoles 10% en Día. Sin tope confirmado.'),

  -- CUENTA DNI (Banco Provincia) — descuentos por día y cadena
  ('Cuenta DNI', '🏦', '#0057a8', 'Cuenta DNI (Banco Provincia)',
   20, array['Lunes','Miércoles','Jueves'],
   array['Día','Carrefour','ChangoMás','La Anónima'],
   '$6.000 por semana',
   'Lunes 10% en Día · Miércoles 10% en Carrefour · Jueves 20% en ChangoMás · La Anónima 10% semanal.'),

  -- PERSONAL PAY — 15% fin de semana en ChangoMás
  ('Personal Pay', '🟢', '#00a550', 'Visa Prepaga',
   15, array['Viernes','Sábado','Domingo'],
   array['ChangoMás'],
   NULL,
   'Viernes a domingo 15% en ChangoMás pagando con QR.'),

  -- ICBC — 30% jueves en ChangoMás, 25% jueves en Coto (cuenta sueldo)
  ('ICBC', '🔷', '#1a5fa8', 'Visa / Mastercard',
   30, array['Jueves'],
   array['ChangoMás','Coto'],
   '$15.000 por semana',
   'Cuenta sueldo. 30% en ChangoMás (tope $15.000/semana). 25% en Coto.');
