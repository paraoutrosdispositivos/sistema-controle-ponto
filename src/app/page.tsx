import { Clock, ShieldCheck, Calendar, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Controle de Ponto
            </span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded border border-zinc-200">
            Ambiente Inicial
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        <div className="max-w-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-zinc-700 text-sm font-medium border border-zinc-200">
            <ShieldCheck className="w-4 h-4 text-zinc-600" />
            Sistema de Gestao de Ponto
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            Plataforma de Controle de Ponto
          </h1>

          <p className="text-zinc-600 text-base md:text-lg leading-relaxed">
            Bem-vindo ao Sistema de Controle de Ponto. O projeto foi inicializado com sucesso e esta pronto para as proximas etapas de desenvolvimento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50">
              <div className="p-2 bg-white rounded border border-zinc-200 w-fit mb-3">
                <Clock className="w-4 h-4 text-zinc-700" />
              </div>
              <h2 className="font-medium text-sm text-zinc-900 mb-1">Registro de Jornada</h2>
              <p className="text-xs text-zinc-500">Horarios oficiais gravados pelo servidor com garantia de imutabilidade.</p>
            </div>

            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50">
              <div className="p-2 bg-white rounded border border-zinc-200 w-fit mb-3">
                <Calendar className="w-4 h-4 text-zinc-700" />
              </div>
              <h2 className="font-medium text-sm text-zinc-900 mb-1">Espelho de Ponto</h2>
              <p className="text-xs text-zinc-500">Visualizacao transparente e organizada das marcacoes de ponto.</p>
            </div>

            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50">
              <div className="p-2 bg-white rounded border border-zinc-200 w-fit mb-3">
                <UserCheck className="w-4 h-4 text-zinc-700" />
              </div>
              <h2 className="font-medium text-sm text-zinc-900 mb-1">Gestao de Perfis</h2>
              <p className="text-xs text-zinc-500">Controle de permissoes para colaboradores e gestores.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-4 px-6 text-center text-xs text-zinc-500">
        Sistema de Controle de Ponto
      </footer>
    </div>
  );
}
