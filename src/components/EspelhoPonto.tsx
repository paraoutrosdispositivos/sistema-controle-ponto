'use client'

import { useState, useMemo } from 'react'
import { RegistroPontoData } from './RegistroPonto'
import {
  Calendar,
  Clock,
  Filter,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react'

type FilterPeriod = 'hoje' | 'mes_atual' | 'todos'

interface EspelhoPontoProps {
  registros: RegistroPontoData[]
  loading?: boolean
  onRefresh?: () => void
}

interface PairInfo {
  entrada: RegistroPontoData
  saida?: RegistroPontoData
  durationMinutes: number
  isOpen: boolean
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0h 00m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

export function EspelhoPonto({ registros, loading = false }: EspelhoPontoProps) {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('hoje')

  // Filter registros according to selected period
  const filteredRegistros = useMemo(() => {
    const active = registros.filter((r) => !r.desconsiderado)

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const currentYearMonth = now.toISOString().substring(0, 7) // YYYY-MM

    return active.filter((r) => {
      const recordDate = new Date(r.data_hora)
      const recordIsoDate = recordDate.toISOString().split('T')[0]
      const recordYearMonth = recordDate.toISOString().substring(0, 7)

      if (filterPeriod === 'hoje') {
        return recordIsoDate === todayStr
      } else if (filterPeriod === 'mes_atual') {
        return recordYearMonth === currentYearMonth
      }
      return true
    })
  }, [registros, filterPeriod])

  // Group filtered records by date (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    // Sort chronological ascending
    const sorted = [...filteredRegistros].sort(
      (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    )

    const groups: { [dateStr: string]: RegistroPontoData[] } = {}
    sorted.forEach((reg) => {
      const dateStr = new Date(reg.data_hora).toLocaleDateString('pt-BR')
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(reg)
    })

    return groups
  }, [filteredRegistros])

  // Process pairs and compute total worked time
  const processedData = useMemo(() => {
    let totalMinutesPeriod = 0
    let totalOpenCount = 0

    const dateDetails: {
      dateStr: string
      pairs: PairInfo[]
      dayTotalMinutes: number
      hasOpen: boolean
    }[] = []

    Object.entries(groupedByDate).forEach(([dateStr, items]) => {
      const pairs: PairInfo[] = []
      let dayTotalMinutes = 0
      let hasOpen = false

      let i = 0
      while (i < items.length) {
        const item = items[i]

        if (item.tipo === 'ENTRADA') {
          const nextItem = items[i + 1]
          if (nextItem && nextItem.tipo === 'SAIDA') {
            const diffMs =
              new Date(nextItem.data_hora).getTime() -
              new Date(item.data_hora).getTime()
            const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)))
            dayTotalMinutes += diffMins
            pairs.push({
              entrada: item,
              saida: nextItem,
              durationMinutes: diffMins,
              isOpen: false,
            })
            i += 2
          } else {
            // Unmatched ENTRADA -> Open session
            hasOpen = true
            totalOpenCount++
            pairs.push({
              entrada: item,
              saida: undefined,
              durationMinutes: 0,
              isOpen: true,
            })
            i += 1
          }
        } else {
          // Unmatched SAIDA (e.g. edge case if first mark is SAIDA)
          i += 1
        }
      }

      totalMinutesPeriod += dayTotalMinutes
      dateDetails.push({
        dateStr,
        pairs,
        dayTotalMinutes,
        hasOpen,
      })
    })

    return {
      totalMinutesPeriod,
      totalOpenCount,
      dateDetails: dateDetails.reverse(), // most recent day first
    }
  }, [groupedByDate])

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-700" />
            Espelho de Ponto Individual
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Historico de marcacoes ativas e apuracao de horas de trabalho
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 self-start sm:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterPeriod('hoje')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterPeriod === 'hoje'
                ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('mes_atual')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterPeriod === 'mes_atual'
                ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Mes Atual
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('todos')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterPeriod === 'todos'
                ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            Total Horas Trabalhadas
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900">
            {formatMinutes(processedData.totalMinutesPeriod)}
          </div>
          <p className="text-xs text-zinc-500">
            {filterPeriod === 'hoje'
              ? 'Apuracao de hoje'
              : filterPeriod === 'mes_atual'
              ? 'Apuracao do mes corrente'
              : 'Apuracao total acumulada'}
          </p>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-600" />
            Total de Marcacoes
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900">
            {filteredRegistros.length}
          </div>
          <p className="text-xs text-zinc-500">Registros ativos no periodo</p>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Jornadas Em Aberto
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900">
            {processedData.totalOpenCount}
          </div>
          <p className="text-xs text-zinc-500">
            {processedData.totalOpenCount > 0
              ? 'Entrada sem saida correspondente'
              : 'Todas as entradas fechadas'}
          </p>
        </div>
      </div>

      {/* Table / List View */}
      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          Carregando registros...
        </div>
      ) : processedData.dateDetails.length === 0 ? (
        <div className="py-12 border border-dashed border-zinc-200 rounded-lg text-center space-y-2">
          <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-sm font-medium text-zinc-700">
            Nenhum registro encontrado para este periodo
          </p>
          <p className="text-xs text-zinc-500">
            Utilize o botao de registro acima para realizar sua primeira marcacao.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {processedData.dateDetails.map((dayGroup) => (
            <div
              key={dayGroup.dateStr}
              className="border border-zinc-200 rounded-lg overflow-hidden"
            >
              <div className="bg-zinc-100 px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-zinc-200">
                <div className="flex items-center gap-2 text-zinc-800 font-semibold">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                  <span>Data: {dayGroup.dateStr}</span>
                </div>
                <div className="flex items-center gap-3">
                  {dayGroup.hasOpen && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-semibold text-xs">
                      <AlertCircle className="w-3 h-3" />
                      Em aberto
                    </span>
                  )}
                  <span className="text-zinc-700 font-mono font-semibold">
                    Total dia: {formatMinutes(dayGroup.dayTotalMinutes)}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-zinc-100">
                {dayGroup.pairs.map((pair, idx) => {
                  const entradaHora = new Date(
                    pair.entrada.data_hora
                  ).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })

                  const saidaHora = pair.saida
                    ? new Date(pair.saida.data_hora).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : null

                  return (
                    <div
                      key={pair.entrada.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-zinc-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-xs font-bold text-zinc-400 font-mono">
                          #{idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Entrada: {entradaHora}
                            </span>

                            {saidaHora ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Saida: {saidaHora}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                Saida: Em aberto
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span>
                              Origem:{' '}
                              <strong className="text-zinc-700 font-normal">
                                {pair.entrada.origem}
                              </strong>
                              {pair.saida && pair.saida.origem !== pair.entrada.origem && (
                                <> / {pair.saida.origem}</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center">
                        {pair.isOpen ? (
                          <span className="text-xs font-semibold text-amber-700">
                            Em aberto (nao somado)
                          </span>
                        ) : (
                          <span className="text-sm font-bold font-mono text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">
                            {formatMinutes(pair.durationMinutes)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
