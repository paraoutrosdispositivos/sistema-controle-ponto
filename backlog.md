# Backlog de Desenvolvimento — Controle de Ponto

## FASE 1: Configuração do Projeto e Banco de Dados
- [ ] **Task 1.1:** Inicializar projeto Next.js (App Router) com TypeScript, Tailwind CSS e Lucide Icons.
- [ ] **Task 1.2:** Configurar Supabase Client e variáveis de ambiente públicas.
- [ ] **Task 1.3:** Executar script `schema.sql` no Supabase, validando funções RPC, triggers e RLS sem erros de recursão.

## FASE 2: Autenticação e Rotas Protegidas
- [ ] **Task 2.1:** Criar tela de Login (Layout limpo, sem emojis, suporte a feedback por toast).
- [ ] **Task 2.2:** Configurar middleware de autenticação e proteção de rotas por perfil (`FUNCIONARIO` / `GESTOR`).
- [ ] **Task 2.3:** Implementar encerramento de sessão (Logout).

## FASE 3: Registro de Ponto (Core e Concorrência)
- [ ] **Task 3.1:** Implementar o botão de bate-ponto consumindo a função RPC `bater_ponto`.
- [ ] **Task 3.2:** Adicionar desabilitação de botão no frontend durante o carregamento para reforço visual contra clique duplo.
- [ ] **Task 3.3:** Exibir confirmação e horário gravado via retorno do banco.

## FASE 4: Espelho de Ponto Individual e Soluções de Ajuste
- [ ] **Task 4.1:** Construir visualização de espelho de ponto filtrando marcações ativas (`desconsiderado = FALSE`).
- [ ] **Task 4.2:** Implementar lógica de cálculo de duração por pares (`ENTRADA` $\rightarrow$ `SAIDA`) e sinalização de marcações "Em aberto".
- [ ] **Task 4.3:** Criar modal para abertura de solicitações de correção (Inclusão, Alteração e Exclusão) e permitir cancelamento de solicitações `PENDENTES`.

## FASE 5: Painel do Gestor (Aprovações e Usuários)
- [ ] **Task 5.1:** Criar tela de análise de solicitações pendentes para o Gestor.
- [ ] **Task 5.2:** Conectar botões de Aprovar/Rejeitar à função RPC `analisar_solicitacao`, validando o bloqueio de autoaprovação.
- [ ] **Task 5.3:** Criar Server Action / Rota de API protegida para cadastro de colaboradores via Supabase Auth Admin e opção de inativação no banco.

## FASE 6: Testes e Validação Final
- [ ] **Task 6.1:** Validar cenários de borda (virada de meia-noite, requisições concorrentes e bloqueio de autoaprovação).
- [ ] **Task 6.2:** Auditoria de interface (garantir layout otimizado para Tablet/Desktop e ausência total de emojis).
