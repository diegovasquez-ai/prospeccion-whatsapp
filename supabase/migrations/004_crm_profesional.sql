-- =====================================================================
-- 004 · CRM profesional de prospección por WhatsApp
-- Requiere las migraciones 001, 002 y 003.
-- NO se ejecuta automáticamente: revísala y ejecútala tú en
-- Supabase → SQL Editor.
-- =====================================================================

-- 1. Más datos de contacto en leads ------------------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS nombre_contacto TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS ciudad TEXT,
  ADD COLUMN IF NOT EXISTS sector TEXT,
  ADD COLUMN IF NOT EXISTS fuente TEXT,
  ADD COLUMN IF NOT EXISTS prioridad TEXT NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS etiquetas TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE leads DROP CONSTRAINT IF EXISTS valid_prioridad;
ALTER TABLE leads ADD CONSTRAINT valid_prioridad
  CHECK (prioridad IN ('alta', 'media', 'baja'));

-- Nueva etapa "cliente" (venta ganada)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS valid_etapa;
ALTER TABLE leads ADD CONSTRAINT valid_etapa
  CHECK (etapa IN (
    'nuevo_lead', 'primer_mensaje_enviado', 'audio_enviado', 'loom_enviado',
    'respondio', 'interesado', 'reunion_agendada', 'cliente', 'cerrado'
  ));

CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- 2. Historial: conversaciones de WhatsApp y duración de llamadas --------
ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER;

ALTER TABLE actividades DROP CONSTRAINT IF EXISTS valid_tipo;
ALTER TABLE actividades ADD CONSTRAINT valid_tipo
  CHECK (tipo IN (
    'primer_mensaje', 'follow_up', 'audio_enviado', 'loom_enviado', 'reunion',
    'nota_interna', 'llamada', 'email', 'whatsapp_saliente',
    'whatsapp_entrante', 'otro'
  ));

-- 3. Seguimientos (tareas programadas por contacto) ----------------------
CREATE TABLE IF NOT EXISTS seguimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (tipo IN ('whatsapp', 'llamada', 'reunion', 'email', 'otro')),
  nota TEXT,
  completado BOOLEAN NOT NULL DEFAULT false,
  completado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seguimientos_lead_id ON seguimientos(lead_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_pendientes
  ON seguimientos(fecha_programada) WHERE completado = false;

DROP TRIGGER IF EXISTS update_seguimientos_updated_at ON seguimientos;
CREATE TRIGGER update_seguimientos_updated_at
  BEFORE UPDATE ON seguimientos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Plantillas de mensajes ----------------------------------------------
CREATE TABLE IF NOT EXISTS plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'otro'
    CHECK (categoria IN ('primer_contacto', 'seguimiento', 'propuesta', 'cierre', 'otro')),
  contenido TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_plantillas_updated_at ON plantillas;
CREATE TRIGGER update_plantillas_updated_at
  BEFORE UPDATE ON plantillas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO plantillas (nombre, categoria, contenido)
SELECT * FROM (VALUES
  ('Primer contacto', 'primer_contacto',
   'Hola {contacto}, ¿cómo estás? Vi {negocio} y me pareció muy interesante. Ayudo a negocios de {sector} a conseguir más clientes. ¿Te puedo contar en 2 minutos cómo?'),
  ('Seguimiento suave', 'seguimiento',
   'Hola {contacto}, te escribo de nuevo por si se te pasó mi mensaje anterior. ¿Tienes 10 minutos esta semana para conversar sobre {negocio}?'),
  ('Envío de propuesta', 'propuesta',
   'Hola {contacto}, como conversamos, te comparto la propuesta para {negocio}. Quedo atento a tus comentarios.'),
  ('Cierre', 'cierre',
   'Hola {contacto}, ¿pudiste revisar la propuesta? Si te parece bien, podemos empezar esta misma semana.')
) AS v(nombre, categoria, contenido)
WHERE NOT EXISTS (SELECT 1 FROM plantillas);

-- 5. Seguridad: solo usuarios autenticados -------------------------------
-- Reemplaza las políticas abiertas de la migración 003 (USING (true) para
-- cualquiera con la anon key) por políticas que exigen iniciar sesión.
DROP POLICY IF EXISTS "Enable all operations for leads" ON leads;
DROP POLICY IF EXISTS "Enable all operations for actividades" ON actividades;

ALTER TABLE seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_authenticated_all" ON leads;
CREATE POLICY "crm_authenticated_all" ON leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_authenticated_all" ON actividades;
CREATE POLICY "crm_authenticated_all" ON actividades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_authenticated_all" ON seguimientos;
CREATE POLICY "crm_authenticated_all" ON seguimientos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_authenticated_all" ON plantillas;
CREATE POLICY "crm_authenticated_all" ON plantillas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
