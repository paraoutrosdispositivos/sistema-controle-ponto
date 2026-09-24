import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { DashboardFuncionario } from '@/components/DashboardFuncionario'
import { Clock, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('usuarios')
    .select('nome, perfil, ativo')
    .eq('id', user.id)
    .single()

  const isGestor = profile?.perfil === 'GESTOR'

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight block leading-none">
                Controle de Ponto
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                Painel do Colaborador
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isGestor && (
              <Link
                href="/gestor"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Painel do Gestor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-zinc-900">
                  {profile?.nome || user.email}
                </span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  {profile?.perfil || 'FUNCIONARIO'}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <DashboardFuncionario userId={user.id} />
      </main>

      <footer className="border-t border-zinc-200 bg-white py-4 px-6 text-center text-xs text-zinc-500">
        Sistema de Controle de Ponto
      </footer>
    </div>
  )
}
