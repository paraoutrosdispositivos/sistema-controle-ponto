import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { Shield, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function GestorPage() {
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

  if (profile?.perfil !== 'GESTOR') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight block leading-none">
                Painel do Gestor
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                Area Administrativa de Gestao
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg border border-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Visao do Funcionario</span>
            </Link>

            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-zinc-900">
                  {profile?.nome || user.email}
                </span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  GESTOR
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-6">
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-zinc-900 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-zinc-700" />
            <h2>Area Exclusiva do Gestor</h2>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Voce possui acesso administrativo ao Painel do Gestor.
            As funcionalidades de gestao, aprovacao de solicitacoes de ajuste e cadastro de colaboradores estarao disponiveis na FASE 5.
          </p>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-4 px-6 text-center text-xs text-zinc-500">
        Sistema de Controle de Ponto
      </footer>
    </div>
  )
}
