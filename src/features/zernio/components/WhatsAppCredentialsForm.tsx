'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Field, Input } from '@/shared/components/ui/Form'
import { Card } from '@/shared/components/ui/Layout'
import { toast } from '@/shared/stores/toast-store'
import { ZERNIO_ACCOUNTS_KEY } from '../hooks/useZernio'
import { zernioApi } from '../services/zernio-api'
import { whatsappCredentialsSchema } from '../types'

const EMPTY = { accessToken: '', wabaId: '', phoneNumberId: '', pin: '' }

/** Conexión headless (BYO-WABA): el número ya pertenece a una WABA del cliente */
export function WhatsAppCredentialsForm({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warning, setWarning] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = whatsappCredentialsSchema.safeParse({ ...form, profileId })
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
      return
    }
    setErrors({})
    setPending(true)
    try {
      const result = await zernioApi.connectWhatsAppCredentials({ ...form, profileId })
      setWarning(result.registrationWarning)
      setForm(EMPTY) // no dejar el token en pantalla
      if (result.saveError) toast.error(`Conectado en Zernio, pero no se guardó en el CRM: ${result.saveError}`)
      else toast.success(`WhatsApp ${result.account.phoneNumber ?? ''} conectado`)
      queryClient.invalidateQueries({ queryKey: ZERNIO_ACCOUNTS_KEY })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo conectar')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-text-primary">Conectar una WABA propia (avanzado)</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Usa esto si tu número <strong>ya pertenece a una WhatsApp Business Account</strong>: Meta no vuelve a hacer el
        registro de un número que ya está en una WABA. El número y la WABA siguen siendo tuyos; Zernio solo recibe
        credenciales para operarla.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" autoComplete="off">
        <Field label="Token permanente del System User *" htmlFor="wa-token" error={errors.accessToken} className="sm:col-span-2"
          hint="Meta Business Suite → Usuarios del sistema. Permisos: whatsapp_business_management y whatsapp_business_messaging. Un token temporal deja de funcionar en 24 h.">
          <Input id="wa-token" type="password" autoComplete="off" value={form.accessToken} onChange={set('accessToken')} />
        </Field>
        <Field label="WABA ID *" htmlFor="wa-waba" error={errors.wabaId}>
          <Input id="wa-waba" inputMode="numeric" value={form.wabaId} onChange={set('wabaId')} />
        </Field>
        <Field label="Phone Number ID *" htmlFor="wa-phone" error={errors.phoneNumberId} hint="WhatsApp Manager → Números de teléfono">
          <Input id="wa-phone" inputMode="numeric" value={form.phoneNumberId} onChange={set('phoneNumberId')} />
        </Field>
        <Field label="PIN de verificación en dos pasos" htmlFor="wa-pin" error={errors.pin} className="sm:col-span-2"
          hint="6 dígitos. Casi todo número de negocio real lo tiene activado: sin el PIN, Meta responde error 133005 y el número queda conectado pero sin poder enviar.">
          <Input id="wa-pin" type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={form.pin} onChange={set('pin')} className="sm:w-40" />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" loading={pending} disabled={!profileId}>Conectar con credenciales</Button>
        </div>
      </form>
      {warning && (
        <p className="mt-4 flex gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>El número quedó conectado pero no puede enviar mensajes.</strong> Meta respondió: {warning}. Si
            menciona 133005, falta o es incorrecto el PIN de verificación en dos pasos: vuelve a conectar con el PIN.
          </span>
        </p>
      )}
    </Card>
  )
}
