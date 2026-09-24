'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Loader2, CheckCircle, AlertCircle, Calendar } from 'lucide-react'

export interface RegistroPontoData {
  id: string
  usuario_id: string
  tipo: 'ENTRADA' | 'SAIDA'
  data_hora: string
  origem: string
  desconsiderado: boolean
  created_at: string
}

interface RegistroPontoProps {
  userId: string
  todayRegistros: RegistroPontoData[]
  onPontoRegistrado: () => void
}

export function RegistroPonto({
  userId,
  todayRegistros,
  onPontoRegistrado,
}: RegistroPontoProps) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
      setCurrentDate(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate next suggested mark type & label
  const count = todayRegistros.length
  const lastRecord = count > 0 ? todayRegistros[todayRegistros.length - 1] : null

  let nextTipoLabel = 'Entrada'
  let nextTipo: 'ENTRADA' | 'SAIDA' = 'ENTRADA'

  if (count === 0) {
    nextTipo = 'ENTRADA'
    nextTipoLabel = 'ENTRADA (Inicio de Jornada)'
  } else if (count === 1) {
    nextTipo = 'SAIDA'
    nextTipoLabel = 'SAIDA_ALMOCO (Saida para Almoço)'
  } else if (count === 2) {
    nextTipo = 'ENTRADA'
    nextTipoLabel = 'RETORNO_ALMOCO (Retorno do Almoço)'
  } else if (count === 3) {
    nextTipo = 'SAIDA'
    nextTipoLabel = 'SAIDA (Fim de Jornada)'
  } else {
    if (lastRecord?.tipo === 'ENTRADA') {
      nextTipo = 'SAIDA'
      nextTipoLabel = 'SAIDA'
    } else {
      nextTipo = 'ENTRADA'
      nextTipoLabel = 'ENTRADA'
    }
  }

  const handleBaterPonto = async () => {
    if (loading) return
    setLoading(true)
    setFeedback(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('bater_ponto', {
        p_usuario_id: userId,
      })

      if (error) {
        setFeedback({
          type: 'error',
          message: error.message || 'Ocorreu um erro ao registrar o ponto.',
        })
      } else if (data) {
        const dataHoraObj = new Date(data.data_hora)
        const horaFormatada = dataHoraObj.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        const tipoFormatado = data.tipo === 'ENTRADA' ? 'Entrada' : 'Saida'

        setFeedback({
          type: 'success',
          message: `Ponto de ${tipoFormatado} registrado com sucesso as ${horaFormatada}. Horario oficial do servidor gravado.`,
        })

        onPontoRegistrado()
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Falha na conexao com o servidor.'
      setFeedback({
        type: 'error',
        message: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-700" />
            Registro de Ponto
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Horario oficial capturado diretamente do servidor PostgreSQL (UTC/TIMESTAMPTZ)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span className="capitalize">{currentDate}</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
        <div className="text-4xl font-mono font-bold tracking-tight text-zinc-900">
          {currentTime || '--:--:--'}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
          <span>Proximo registro sugerido:</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-semibold">
            {nextTipoLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={handleBaterPonto}
          disabled={loading}
          className={`w-full max-w-sm py-3.5 px-6 rounded-lg font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            loading
              ? 'bg-zinc-300 text-zinc-600 cursor-not-allowed'
              : nextTipo === 'ENTRADA'
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-[0.99]'
              : 'bg-amber-700 hover:bg-amber-800 text-white active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registrando...</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span>
                Registrar {nextTipo === 'ENTRADA' ? 'Entrada' : 'Saida'} Agora
              </span>
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg text-sm flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
