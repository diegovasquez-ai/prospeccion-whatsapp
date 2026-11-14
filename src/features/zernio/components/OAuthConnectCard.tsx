'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Layout'
import { cn } from '@/shared/utils/cn'
import { useZernioOAuth } from '../hooks/useZernio'
import {
  OAUTH_PLATFORMS,
  PLATFORM_LABELS,
  type ConnectRequest,
  type InstagramLoginMethod,
  type OAuthPlatform,
  type WhatsAppOnboarding,
} from '../types'
import { OptionCard } from './OptionCard'

function buildRequest(
  platform: OAuthPlatform,
  profileId: string,
  onboarding: WhatsAppOnboarding,
  loginMethod: InstagramLoginMethod
): ConnectRequest {
  if (platform === 'whatsapp') return { platform, profileId, onboarding }
  if (platform === 'instagram') return { platform, profileId, loginMethod }
  return { platform, profileId }
}

function WhatsAppModes({ value, onChange }: { value: WhatsAppOnboarding; onChange: (v: WhatsAppOnboarding) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-medium text-text-secondary">¿Dónde vive hoy tu número?</legend>
      <OptionCard name="onboarding" value="business_app" checked={value === 'business_app'} onChange={(v) => onChange(v as WhatsAppOnboarding)} title="En la app WhatsApp Business del celular" badge="Lo normal">
        Coexistencia: el número <strong>sigue funcionando en tu celular</strong> y lo que contestes desde la app también
        llega al CRM. Es el caso de casi cualquier negocio pequeño.
      </OptionCard>
      <OptionCard name="onboarding" value="api" checked={value === 'api'} onChange={(v) => onChange(v as WhatsAppOnboarding)} title="Ya está en WhatsApp Cloud API">
        Muestra el selector de WABA de Meta y el número <strong>deja de funcionar en la app del celular</strong>. Solo
        sirve si el número ya fue migrado a Cloud API.
      </OptionCard>
      {value === 'api' && (
        <p className="flex gap-2 rounded-lg border border-vivid-yellow/30 bg-vivid-yellow/5 p-2 text-xs text-vivid-yellow">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Si Meta muestra tu número como &quot;no cumple los requisitos&quot;, no es un problema del número: está en la app
          WhatsApp Business. Vuelve y elige la primera opción.
        </p>
      )}
    </fieldset>
  )
}

function InstagramModes({ value, onChange }: { value: InstagramLoginMethod; onChange: (v: InstagramLoginMethod) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-medium text-text-secondary">¿Cómo quieres autorizar Instagram?</legend>
      <OptionCard name="loginMethod" value="instagram_login" checked={value === 'instagram_login'} onChange={(v) => onChange(v as InstagramLoginMethod)} title="Con mi cuenta de Instagram" badge="Recomendado">
        Autoriza directamente tu cuenta profesional, sin necesitar una Página de Facebook.
      </OptionCard>
      <OptionCard name="loginMethod" value="facebook_login" checked={value === 'facebook_login'} onChange={(v) => onChange(v as InstagramLoginMethod)} title="A través de una Página de Facebook">
        Pasa por la Página que tiene tu Instagram vinculado; agrega un paso más de selección.
      </OptionCard>
    </fieldset>
  )
}

export function OAuthConnectCard({ profileId }: { profileId: string }) {
  const [platform, setPlatform] = useState<OAuthPlatform>('whatsapp')
  const [onboarding, setOnboarding] = useState<WhatsAppOnboarding>('business_app')
  const [loginMethod, setLoginMethod] = useState<InstagramLoginMethod>('instagram_login')
  const [pending, setPending] = useState(false)
  const connect = useZernioOAuth()

  const handleConnect = async () => {
    setPending(true)
    await connect(buildRequest(platform, profileId, onboarding, loginMethod))
    setPending(false)
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-text-primary">Conectar con inicio de sesión</h2>
      <p className="mt-1 text-sm text-text-secondary">Se abre una ventana de Meta; autorizas y vuelves aquí.</p>

      <div className="my-4 flex gap-2" role="tablist">
        {OAUTH_PLATFORMS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={platform === p}
            onClick={() => setPlatform(p)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm',
              platform === p ? 'border-vivid-cyan/60 bg-vivid-cyan/10 text-text-primary' : 'border-border-primary text-text-secondary hover:text-text-primary'
            )}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      {platform === 'whatsapp' && <WhatsAppModes value={onboarding} onChange={setOnboarding} />}
      {platform === 'instagram' && <InstagramModes value={loginMethod} onChange={setLoginMethod} />}
      {platform === 'facebook' && (
        <p className="text-sm text-text-secondary">Elige la Página de Facebook cuyos mensajes de Messenger quieres recibir.</p>
      )}

      <Button className="mt-4" onClick={handleConnect} loading={pending} disabled={!profileId}>
        Conectar {PLATFORM_LABELS[platform]}
      </Button>
      {!profileId && <p className="mt-2 text-xs text-text-tertiary">Primero elige un perfil de Zernio.</p>}
    </Card>
  )
}
