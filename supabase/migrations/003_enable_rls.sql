-- Habilitar Row Level Security (RLS) para ambas tablas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

-- Políticas para leads (permitir todas las operaciones - single user)
CREATE POLICY "Enable all operations for leads"
  ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para actividades (permitir todas las operaciones - single user)
CREATE POLICY "Enable all operations for actividades"
  ON actividades
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentarios
COMMENT ON POLICY "Enable all operations for leads" ON leads
  IS 'Permite todas las operaciones ya que es una app de usuario único';
COMMENT ON POLICY "Enable all operations for actividades" ON actividades
  IS 'Permite todas las operaciones ya que es una app de usuario único';
