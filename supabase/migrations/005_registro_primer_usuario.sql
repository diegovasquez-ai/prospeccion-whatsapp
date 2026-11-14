-- =====================================================================
-- 005 · Registro del dueño del CRM desde la pantalla de login
-- - Solo se permite crear UNA cuenta (la primera). Las siguientes se rechazan.
-- - La cuenta queda confirmada al crearse (no depende del email de confirmación).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.crm_solo_primer_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users) THEN
    RAISE EXCEPTION 'El CRM ya tiene una cuenta registrada';
  END IF;
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_solo_primer_usuario ON auth.users;
CREATE TRIGGER crm_solo_primer_usuario
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.crm_solo_primer_usuario();

-- Permite a la pantalla de login saber si ya existe la cuenta
CREATE OR REPLACE FUNCTION public.crm_tiene_usuario()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users);
$$;

REVOKE ALL ON FUNCTION public.crm_solo_primer_usuario() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_tiene_usuario() TO anon, authenticated;
