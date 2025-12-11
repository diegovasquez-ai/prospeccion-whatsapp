'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { KanbanBoard } from '@/features/leads/components/KanbanBoard'
import { LeadDetailPanel } from '@/features/leads/components/LeadDetailPanel'
import { CreateLeadModal } from '@/features/leads/components/CreateLeadModal'
import type { Lead } from '@/features/leads/types'

export default function PipelinePage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [esCalificadoFilter, setEsCalificadoFilter] = useState<boolean | null>(
    null
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border-primary px-6 py-4 bg-background-elevated">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-text-primary">
              Pipeline de Prospección
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-vivid text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg shadow-vivid-cyan/20"
            >
              <Plus size={20} />
              Nuevo Lead
            </button>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-card border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary placeholder:text-text-tertiary transition-all"
              />
            </div>

            {/* Filtro por calificado */}
            <select
              value={esCalificadoFilter === null ? 'all' : String(esCalificadoFilter)}
              onChange={(e) =>
                setEsCalificadoFilter(
                  e.target.value === 'all' ? null : e.target.value === 'true'
                )
              }
              className="px-4 py-2 bg-background-card border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary transition-all"
            >
              <option value="all">Todos los leads</option>
              <option value="true">Solo calificados</option>
              <option value="false">No calificados</option>
            </select>
          </div>
        </header>

        {/* Kanban Board */}
        <main className="flex-1 overflow-x-auto px-6 py-4 bg-background">
          <KanbanBoard
            searchQuery={searchQuery}
            esCalificadoFilter={esCalificadoFilter}
            onLeadClick={(lead) => setSelectedLead(lead)}
          />
        </main>
      </div>

      {/* Side panel de detalle */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      {/* Modal de crear lead */}
      {isCreateModalOpen && (
        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  )
}
