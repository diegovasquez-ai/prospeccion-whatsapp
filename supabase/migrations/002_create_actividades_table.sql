-- Crear tabla de actividades
CREATE TABLE IF NOT EXISTS actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tipo TEXT NOT NULL,
  resultado TEXT,
  nota TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_actividades_lead_id ON actividades(lead_id);
CREATE INDEX idx_actividades_fecha_hora ON actividades(fecha_hora DESC);
CREATE INDEX idx_actividades_tipo ON actividades(tipo);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_actividades_updated_at
  BEFORE UPDATE ON actividades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Constraint para validar tipos de actividad válidos
ALTER TABLE actividades ADD CONSTRAINT valid_tipo
  CHECK (tipo IN (
    'primer_mensaje',
    'follow_up',
    'audio_enviado',
    'loom_enviado',
    'reunion',
    'nota_interna',
    'llamada',
    'email',
    'otro'
  ));

-- Constraint para validar resultados válidos (opcional)
ALTER TABLE actividades ADD CONSTRAINT valid_resultado
  CHECK (resultado IS NULL OR resultado IN (
    'respondio',
    'no_respondio',
    'reprogramado',
    'interesado',
    'no_interesado',
    'completado',
    'pendiente'
  ));

-- Comentarios para documentación
COMMENT ON TABLE actividades IS 'Línea de tiempo de actividades asociadas a cada lead';
COMMENT ON COLUMN actividades.lead_id IS 'Referencia al lead asociado';
COMMENT ON COLUMN actividades.tipo IS 'Tipo de actividad realizada';
COMMENT ON COLUMN actividades.resultado IS 'Resultado o estado de la actividad';
COMMENT ON COLUMN actividades.nota IS 'Nota adicional sobre la actividad';
