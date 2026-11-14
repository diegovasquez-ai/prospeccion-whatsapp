'use client'

import { useState } from 'react'
import { CheckCircle2, Plug, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Field, Select } from '@/shared/components/ui/Form'
import { Card, EmptyState, ErrorState, LoadingState, Page, PageHeader } from '@/shared/components/ui/Layout'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { OAuthConnectCard } from '@/features/zernio/components/OAuthConnectCard'
import { WhatsAppCredentialsForm } from '@/features/zernio/components/WhatsAppCredentialsForm'
import { useZernioAccounts, useZernioProfiles } from '@/features/zernio/hooks/useZernio'
import { PLATFORM_LABELS } from '@/features/zernio/types'

function ConnectedAccounts() {
  const { data, isLoading, error, refetch, isFetching } = useZernioAccounts()
  const accounts = data?.accounts ?? []
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Cuentas conectadas</h2>
        <Button size="sm" variant="ghost" onClick={() => refetch()} loading={isFetching}><RefreshCw size={14} /> Actualizar</Button>
      </div>
      {data?.saveError && <p className="mb-3 text-xs text-vivid-yellow">No se guardaron en el CRM: {data.saveError}</p>}
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : accounts.length === 0 ? (
        <EmptyState icon={<Plug size={28} />} title="Aún no hay cuentas conectadas" description="Conecta tu WhatsApp abajo." />
      ) : (
        <ul className="divide-y divide-border-primary">
          {accounts.map((a) => (
            <li key={a.accountId} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{a.displayName ?? a.username ?? a.accountId}</p>
                <p className="text-xs text-text-tertiary">{PLATFORM_LABELS[a.platform] ?? a.platform}{a.phoneNumber ? ` · ${a.phoneNumber}` : ''}</p>
              </div>
              <StatusBadge label={a.isActive ? 'Activa' : 'Desconectada'} variant={a.isActive ? 'success' : 'danger'} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function IntegracionesPage() {
  const { data: profiles = [], isLoading, error } = useZernioProfiles()
  const [profileId, setProfileId] = useState('')
  const selected = profileId || (profiles.length === 1 ? profiles[0].profileId : '')

  if (!isSupabaseConfigured) {
    return (
      <Page className="max-w-3xl">
        <PageHeader title="Integraciones" />
        <Card><EmptyState title="Conecta Supabase primero" description="Las integraciones necesitan tu base de datos e inicio de sesión." /></Card>
      </Page>
    )
  }

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Integraciones" description="Conecta tu WhatsApp, Instagram o Messenger a través de Zernio" />
      {isLoading ? <LoadingState label="Consultando Zernio…" /> : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="space-y-6">
          <Card className="p-5">
            <Field label="Perfil de Zernio" htmlFor="profile" hint="Las cuentas se agrupan por perfil (por ejemplo, uno por marca o cliente).">
              <Select id="profile" value={selected} onChange={(e) => setProfileId(e.target.value)} placeholder="Elige un perfil…" options={profiles.map((p) => ({ value: p.profileId, label: p.name }))} />
            </Field>
            {selected && <p className="mt-2 flex items-center gap-1 text-xs text-vivid-green"><CheckCircle2 size={12} /> Perfil listo</p>}
          </Card>
          <ConnectedAccounts />
          <OAuthConnectCard profileId={selected} />
          <WhatsAppCredentialsForm profileId={selected} />
        </div>
      )}
    </Page>
  )
}
