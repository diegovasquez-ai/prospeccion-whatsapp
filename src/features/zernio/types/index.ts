import { z } from 'zod'

/** Plataformas que conectamos por OAuth (Zernio usa "facebook" para Messenger) */
export const OAUTH_PLATFORMS = ['whatsapp', 'instagram', 'facebook'] as const
export type OAuthPlatform = (typeof OAUTH_PLATFORMS)[number]

export const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Messenger',
}

/**
 * business_app → coexistencia: el número sigue en la app WhatsApp Business del
 *                celular y lo que se responde desde ahí también llega al CRM.
 * api          → selector de WABA de Meta; solo si el número YA está en Cloud API.
 */
export const WHATSAPP_ONBOARDING = ['business_app', 'api'] as const
export type WhatsAppOnboarding = (typeof WHATSAPP_ONBOARDING)[number]

/** instagram_login (por defecto) no necesita Página de Facebook */
export const INSTAGRAM_LOGIN_METHODS = ['instagram_login', 'facebook_login'] as const
export type InstagramLoginMethod = (typeof INSTAGRAM_LOGIN_METHODS)[number]

export const connectRequestSchema = z.discriminatedUnion('platform', [
  z.object({
    platform: z.literal('whatsapp'),
    profileId: z.string().min(1, 'Elige un perfil'),
    onboarding: z.enum(WHATSAPP_ONBOARDING),
  }),
  z.object({
    platform: z.literal('instagram'),
    profileId: z.string().min(1, 'Elige un perfil'),
    loginMethod: z.enum(INSTAGRAM_LOGIN_METHODS).default('instagram_login'),
  }),
  z.object({
    platform: z.literal('facebook'),
    profileId: z.string().min(1, 'Elige un perfil'),
  }),
])
export type ConnectRequest = z.input<typeof connectRequestSchema>

export const whatsappCredentialsSchema = z.object({
  profileId: z.string().min(1, 'Elige un perfil'),
  accessToken: z.string().trim().min(20, 'Pega el token permanente del System User'),
  wabaId: z.string().trim().regex(/^\d+$/, 'El WABA ID son solo números'),
  phoneNumberId: z.string().trim().regex(/^\d+$/, 'El Phone Number ID son solo números'),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'El PIN de verificación en dos pasos tiene 6 dígitos')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})
export type WhatsAppCredentialsInput = z.input<typeof whatsappCredentialsSchema>

/** Cuenta conectada, ya normalizada (Zernio usa id, _id o accountId según el endpoint) */
export interface ZernioAccount {
  accountId: string
  platform: string
  profileId: string | null
  username: string | null
  displayName: string | null
  phoneNumber: string | null
  isActive: boolean
}

export interface ZernioProfile {
  profileId: string
  name: string
}

export interface CredentialsConnectResult {
  account: ZernioAccount
  /** Meta rechazó el registro en Cloud API: el número no podrá enviar hasta corregirlo */
  registrationWarning: string | null
}

/** Mensajes en español para los códigos de error conocidos de Zernio y Meta */
export const CONNECT_ERROR_MESSAGES: Record<string, string> = {
  one_whatsapp_per_profile:
    'Este perfil ya tiene un WhatsApp conectado. Usa otro perfil o desconecta el actual.',
  whatsapp_number_pinned_to_profile:
    'Ese número fue comprado en Zernio para otro perfil. Conéctalo desde ese perfil.',
  whatsapp_number_already_connected: 'Ese número ya está conectado en otro perfil o equipo.',
  WHATSAPP_NUMBER_PINNED_TO_PROFILE:
    'Ese número fue comprado en Zernio para otro perfil. Conéctalo desde ese perfil.',
  WHATSAPP_NUMBER_ALREADY_CONNECTED: 'Ese número ya está conectado en otro perfil o equipo.',
  WHATSAPP_COEXISTENCE_NOT_REGISTERED:
    'El número vive en la app WhatsApp Business y nunca se registró en Cloud API. Ten WhatsApp Business abierto y actualizado en el celular y conecta con el modo "App WhatsApp Business".',
}

export function connectErrorMessage(code: string | null | undefined, fallback: string): string {
  if (!code) return fallback
  return CONNECT_ERROR_MESSAGES[code] ?? fallback
}
