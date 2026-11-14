import { redirect } from 'next/navigation'

/** La vista HOY se integró en Seguimientos */
export default function HoyPage() {
  redirect('/seguimientos')
}
