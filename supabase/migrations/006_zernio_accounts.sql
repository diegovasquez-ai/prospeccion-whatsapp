-- =====================================================================
-- 006 · Cuentas conectadas en Zernio (WhatsApp, Instagram, Messenger)
-- zernio_account_id es ÚNICO: con él se rutean los mensajes entrantes.
-- =====================================================================

CREATE TABLE IF NOT EXISTS zernio_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zernio_account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  profile_id TEXT,
  username TEXT,
  display_name TEXT,
  phone_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connection_method TEXT NOT NULL DEFAULT 'oauth'
    CHECK (connection_method IN ('oauth', 'credentials')),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS zernio_accounts_zernio_account_id_key
  ON zernio_accounts(zernio_account_id);
CREATE INDEX IF NOT EXISTS idx_zernio_accounts_platform ON zernio_accounts(platform);

DROP TRIGGER IF EXISTS update_zernio_accounts_updated_at ON zernio_accounts;
CREATE TRIGGER update_zernio_accounts_updated_at
  BEFORE UPDATE ON zernio_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE zernio_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_authenticated_all" ON zernio_accounts;
CREATE POLICY "crm_authenticated_all" ON zernio_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
