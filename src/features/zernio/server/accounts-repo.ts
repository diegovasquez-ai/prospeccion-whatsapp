/**
 * Persistencia de cuentas de Zernio. zernio_account_id es único: es la clave
 * con la que se rutean los mensajes entrantes al contacto/cliente correcto.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ZernioAccount } from '../types'

export type ConnectionMethod = 'oauth' | 'credentials'

function toRow(account: ZernioAccount, method?: ConnectionMethod) {
  return {
    zernio_account_id: account.accountId,
    platform: account.platform,
    profile_id: account.profileId,
    username: account.username,
    display_name: account.displayName,
    phone_number: account.phoneNumber,
    is_active: account.isActive,
    ...(method ? { connection_method: method } : {}),
  }
}

/** Inserta o actualiza por zernio_account_id; devuelve un error legible o null */
export async function upsertAccounts(
  db: SupabaseClient,
  accounts: ZernioAccount[],
  method?: ConnectionMethod
): Promise<string | null> {
  if (accounts.length === 0) return null
  const { error } = await db
    .from('zernio_accounts')
    .upsert(accounts.map((a) => toRow(a, method)), { onConflict: 'zernio_account_id' })
  if (!error) return null
  return /zernio_accounts|relation|schema cache/i.test(error.message)
    ? 'Falta la tabla zernio_accounts (migración 006)'
    : error.message
}
