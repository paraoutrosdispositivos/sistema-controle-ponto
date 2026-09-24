'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RegistroPonto, RegistroPontoData } from './RegistroPonto'
import { EspelhoPonto } from './EspelhoPonto'

interface DashboardFuncionarioProps {
  userId: string
}

export function DashboardFuncionario({ userId }: DashboardFuncionarioProps) {
  const [registros, setRegistros] = useState<RegistroPontoData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRegistros = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('usuario_id', userId)
        .eq('desconsiderado', false)
        .order('data_hora', { ascending: true })

      if (error) {
        console.error('Erro ao buscar registros de ponto:', error.message)
      } else if (data) {
        setRegistros(data as RegistroPontoData[])
      }
    } catch (err) {
      console.error('Falha ao consultar registros:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchRegistros()
  }, [fetchRegistros])

  // Filter today's active markings to pass into RegistroPonto
  const todayRegistros = useMemo(() => {
    const todayIsoStr = new Date().toISOString().split('T')[0]
    return registros.filter((r) => {
      const dateStr = new Date(r.data_hora).toISOString().split('T')[0]
      return dateStr === todayIsoStr && !r.desconsiderado
    })
  }, [registros])

  return (
    <div className="space-y-6">
      <RegistroPonto
        userId={userId}
        todayRegistros={todayRegistros}
        onPontoRegistrado={fetchRegistros}
      />

      <EspelhoPonto
        registros={registros}
        loading={loading}
        onRefresh={fetchRegistros}
      />
    </div>
  )
}
