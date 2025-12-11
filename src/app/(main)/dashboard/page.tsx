'use client'

import { useMemo } from 'react'
import { TrendingUp, Users, MessageCircle, CheckCircle, Calendar } from 'lucide-react'
import { useLeadsMetrics } from '@/features/leads/hooks/useLeads'
import { ETAPA_LABELS, type EtapaLeadType } from '@/features/leads/types'
import { startOfWeek, endOfWeek } from 'date-fns'

export default function DashboardPage() {
  // Calcular semana actual
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), [])

  const { data: metrics, isLoading } = useLeadsMetrics(weekStart, weekEnd)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-text-secondary">Cargando métricas...</p>
      </div>
    )
  }

  const {
    leadsCreados = 0,
    leadsContactados = 0,
    porcentajeRespuesta = 0,
    porcentajeInteresados = 0,
    reunionesAgendadas = 0,
    leadsPorEtapa = {},
  } = metrics || {}

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">Métricas de prospección y embudo</p>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard
            icon={<Users className="text-vivid-cyan" size={24} />}
            label="Leads creados (semana)"
            value={leadsCreados}
            bgColor="bg-vivid-cyan/10"
            borderColor="border-vivid-cyan/30"
          />
          <KPICard
            icon={<MessageCircle className="text-vivid-green" size={24} />}
            label="Leads contactados (semana)"
            value={leadsContactados}
            bgColor="bg-vivid-green/10"
            borderColor="border-vivid-green/30"
          />
          <KPICard
            icon={<CheckCircle className="text-vivid-purple" size={24} />}
            label="% Respuesta"
            value={`${porcentajeRespuesta.toFixed(1)}%`}
            bgColor="bg-vivid-purple/10"
            borderColor="border-vivid-purple/30"
          />
          <KPICard
            icon={<TrendingUp className="text-vivid-yellow" size={24} />}
            label="% Interesados"
            value={`${porcentajeInteresados.toFixed(1)}%`}
            bgColor="bg-vivid-yellow/10"
            borderColor="border-vivid-yellow/30"
          />
          <KPICard
            icon={<Calendar className="text-vivid-magenta" size={24} />}
            label="Reuniones agendadas"
            value={reunionesAgendadas}
            bgColor="bg-vivid-magenta/10"
            borderColor="border-vivid-magenta/30"
          />
        </div>

        {/* Gráfico de embudo */}
        <div className="bg-background-card rounded-lg border border-border-primary shadow-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Embudo de prospección
          </h2>

          <FunnelChart leadsPorEtapa={leadsPorEtapa} />
        </div>
      </div>
    </div>
  )
}

// Componente KPI Card
function KPICard({
  icon,
  label,
  value,
  bgColor,
  borderColor,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  bgColor: string
  borderColor: string
}) {
  return (
    <div className={`bg-background-card rounded-lg border ${borderColor} shadow-lg p-6 transition-all hover:scale-105`}>
      <div className={`inline-flex p-3 rounded-lg ${bgColor} mb-3 border ${borderColor}`}>{icon}</div>
      <div className="text-3xl font-bold text-text-primary mb-1">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
    </div>
  )
}

// Componente Funnel Chart
function FunnelChart({
  leadsPorEtapa,
}: {
  leadsPorEtapa: Record<string, number>
}) {
  const etapas: EtapaLeadType[] = [
    'nuevo_lead',
    'primer_mensaje_enviado',
    'audio_enviado',
    'loom_enviado',
    'respondio',
    'interesado',
    'reunion_agendada',
    'cerrado',
  ]

  const maxLeads = Math.max(...Object.values(leadsPorEtapa), 1)

  return (
    <div className="space-y-3">
      {etapas.map((etapa) => {
        const count = leadsPorEtapa[etapa] || 0
        const percentage = (count / maxLeads) * 100

        return (
          <div key={etapa} className="flex items-center gap-4">
            <div className="w-48 text-sm text-text-primary font-medium">
              {ETAPA_LABELS[etapa]}
            </div>

            <div className="flex-1 bg-background-elevated border border-border-primary rounded-full h-10 relative overflow-hidden">
              <div
                className="bg-gradient-vivid h-full rounded-full transition-all duration-500 flex items-center justify-end px-4 shadow-lg"
                style={{ width: `${percentage}%` }}
              >
                {count > 0 && (
                  <span className="text-white font-semibold text-sm drop-shadow-md">
                    {count}
                  </span>
                )}
              </div>
            </div>

            <div className="w-16 text-right text-sm text-text-secondary">
              {percentage.toFixed(0)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}
