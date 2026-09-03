# Especificação Técnica (SPEC) — Sistema de Controle de Ponto

## 1. Objetivo do Sistema
O **Sistema de Controle de Ponto** gerencia o registro de jornada dos colaboradores com garantia de imutabilidade dos dados originais, transparência e controle de acessos por perfil.

---

## 2. Escopo e Limitações

### 2.1. O que ESTÁ no escopo
* Autenticação e gestão de usuários com perfis (`FUNCIONARIO` e `GESTOR`).
* Registro rápido de ponto com alternância automática (`ENTRADA`/`SAIDA`) de forma atômica no banco.
* Registro em tempo real com horário oficial gravado pelo servidor (UTC/TIMESTAMPTZ).
* Visualização individual e em equipe do espelho de ponto.
* Fluxo de solicitação de ajuste pelo funcionário (Inclusão, Alteração e Exclusão lógica).
* Painel de aprovação/rejeitar pelo gestor com bloqueio de autoaprovação.
* Histórico imutável para auditoria.

### 2.2. O que NÃO está no escopo (Limitações)
* Não haverá cálculo de banco de horas, horas extras ou tolerâncias CLT.
* Não haverá cadastro de escalas de trabalho ou jornada contratual.
* Não haverá integração com folha de pagamento externa.
* Não haverá captura de geolocalização (GPS) ou biometria.
* O sistema é projetado exclusivamente para navegadores em Tablets e Desktops.

---

## 3. Perfis de Usuário e Permissões

### 3.1. Funcionário (`FUNCIONARIO`)
* **Permissões:**
  * Registrar o próprio ponto via chamada RPC atômica.
  * Visualizar suas próprias marcações e espelho de ponto.
  * Criar solicitações de correção informando justificativa obrigatória.
  * Cancelar suas próprias solicitações enquanto estiverem no status `PENDENTE`.
* **Restrições:**
  * Não pode alterar ou apagar registros de ponto.
  * Não pode visualizar dados de outros funcionários.
  * Não pode aprovar ou rejeitar solicitações.

### 3.2. Gestor (`GESTOR`)
* **Permissões:**
  * Executar todas as ações de um Funcionário para sua própria jornada.
  * Visualizar histórico e espelho de ponto de todos os funcionários.
  * Analisar, aprovar ou rejeitar solicitações de ajuste de terceiros.
  * Cadastrar colaboradores via Supabase Auth Admin e inativar perfis.
* **Restrições:**
  * Não pode aprovar ou rejeitar as próprias solicitações de ajuste.
  * Não pode apagar fisicamente registros de ponto ou usuários do banco.

---

## 4. Regras de Negócio e Arquitetura do Banco

### 4.1. Registro e Concorrência de Ponto
1. **Atomicidade:** A alternância `ENTRADA` $\rightarrow$ `SAIDA` é processada via função RPC `bater_ponto(p_usuario_id)`. A função executa um bloqueio de linha (`FOR UPDATE`) no último registro do usuário para prevenir condições de corrida (cliques simultâneos).
2. **Carimbo Confiável:** A data/hora é definida pelo `NOW()` do servidor PostgreSQL.

### 4.2. Imutabilidade e Ajustes
1. **Append-Only:** A tabela `registros_ponto` não recebe `UPDATE` ou `DELETE` direto via API.
2. **Efeito das Correções Aprovadas:**
   * **INCLUSAO:** Insere novo registro com `origem = 'AJUSTE_MANUAL'`.
   * **ALTERACAO:** Atualiza o registro original para `desconsiderado = TRUE` e insere a nova marcação com `origem = 'AJUSTE_MANUAL'`.
   * **EXCLUSAO:** Atualiza o registro original para `desconsiderado = TRUE`.

### 4.3. Cálculo de Horas Trabalhadas
1. São consultadas apenas as marcações do usuário com `desconsiderado = FALSE`, ordenadas por `data_hora ASC`.
2. As marcações são agrupadas em pares ordenados ($E_1, S_1$), ($E_2, S_2$).
3. Para cada par completo, a duração é calculada por $\Delta t = T_{\text{SAIDA}} - T_{\text{ENTRADA}}$.
4. Entradas sem uma saída correspondente ficam sinalizadas como "Em aberto" e não somam horas no total até serem fechadas.
5. Viradas de dia/meia-noite são calculadas naturalmente pelo intervalo entre os carimbos `TIMESTAMPTZ`.

---

## 5. Stack Tecnológica e Segurança

### 5.1. Stack Definida
* **Frontend / Framework:** Next.js (App Router) + TypeScript.
* **Estilização e Ícones:** Tailwind CSS + Lucide Icons.
* **Backend e Banco de Dados:** Supabase (PostgreSQL, Supabase Auth, RLS, Functions RPC).

### 5.2. Diretrizes de Segurança
* Nenhuma chave privada ou segredo (`service_role`) deve ser armazenado no frontend ou enviado ao repositório Git.
* A criação de usuários pelo Gestor é realizada por rota de servidor segura/Edge Function integrada ao Supabase Auth.
