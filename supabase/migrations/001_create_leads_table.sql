-- Crear tabla de leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_negocio TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  etapa TEXT NOT NULL DEFAULT 'nuevo_lead',
  es_calificado BOOLEAN DEFAULT false,
  respondio BOOLEAN DEFAULT false,
  acepto_loom BOOLEAN DEFAULT false,
  loom_enviado BOOLEAN DEFAULT false,
  pdf_armado BOOLEAN DEFAULT false,
  tuvo_reunion BOOLEAN DEFAULT false,
  observacion_general TEXT,
  observacion_post_reunion TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_ultimo_contacto TIMESTAMP WITH TIME ZONE,
  proxima_fecha_seguimiento TIMESTAMP WITH TIME ZONE,
  fecha_reunion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_leads_etapa ON leads(etapa);
CREATE INDEX idx_leads_proxima_fecha_seguimiento ON leads(proxima_fecha_seguimiento);
CREATE INDEX idx_leads_fecha_reunion ON leads(fecha_reunion);
CREATE INDEX idx_leads_es_calificado ON leads(es_calificado);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Constraint para validar etapas válidas
ALTER TABLE leads ADD CONSTRAINT valid_etapa
  CHECK (etapa IN (
    'nuevo_lead',
    'primer_mensaje_enviado',
    'audio_enviado',
    'loom_enviado',
    'respondio',
    'interesado',
    'reunion_agendada',
    'cerrado'
  ));

-- Comentarios para documentación
COMMENT ON TABLE leads IS 'Tabla principal de leads para prospección por WhatsApp';
COMMENT ON COLUMN leads.etapa IS 'Etapa actual del lead en el pipeline de prospección';
COMMENT ON COLUMN leads.es_calificado IS 'Indica si el lead cumple criterios de calificación';
COMMENT ON COLUMN leads.whatsapp IS 'Número de WhatsApp del contacto (formato internacional preferido)';
