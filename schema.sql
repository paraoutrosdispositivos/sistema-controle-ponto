-- ==========================================
-- ESTRUTURA DO BANCO DE DADOS — SUPABASE / POSTGRESQL
-- Sistema de Controle de Ponto
-- ==========================================

-- 1. TIPOS ENUMERADOS (ENUMS)
CREATE TYPE public.perfil_usuario_enum AS ENUM ('FUNCIONARIO', 'GESTOR');
CREATE TYPE public.tipo_marcacao_enum AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE public.tipo_solicitacao_enum AS ENUM ('INCLUSAO', 'ALTERACAO', 'EXCLUSAO');
CREATE TYPE public.status_solicitacao_enum AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO');

-- 2. TABELA DE USUÁRIOS (Sincronizada com auth.users)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    perfil public.perfil_usuario_enum NOT NULL DEFAULT 'FUNCIONARIO',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE REGISTROS DE PONTO (Append-Only)
CREATE TABLE public.registros_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    tipo public.tipo_marcacao_enum NOT NULL,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    origem TEXT NOT NULL DEFAULT 'SISTEMA', -- 'SISTEMA' ou 'AJUSTE_MANUAL'
    desconsiderado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE SOLICITAÇÕES DE CORREÇÃO
CREATE TABLE public.solicitacoes_correcao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    registro_ponto_id UUID NULL REFERENCES public.registros_ponto(id) ON DELETE RESTRICT,
    tipo_solicitacao public.tipo_solicitacao_enum NOT NULL,
    tipo_marca_proposta public.tipo_marcacao_enum NOT NULL,
    data_hora_proposta TIMESTAMPTZ NOT NULL,
    justificativa TEXT NOT NULL,
    status public.status_solicitacao_enum NOT NULL DEFAULT 'PENDENTE',
    analisado_por_id UUID NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    motivo_resposta TEXT NULL,
    analisado_em TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_nao_auto_aprovar CHECK (usuario_id <> analisado_por_id)
);

-- 5. ÍNDICES
CREATE INDEX idx_registros_ponto_usuario_data ON public.registros_ponto(usuario_id, data_hora DESC);
CREATE INDEX idx_registros_ponto_ativos ON public.registros_ponto(usuario_id, desconsiderado) WHERE desconsiderado = FALSE;
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes_correcao(status);

-- 6. FUNÇÃO AUXILIAR DE CHECAGEM DE GESTOR (Anti-Recursão RLS)
CREATE OR REPLACE FUNCTION public.is_gestor(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE id = p_user_id AND perfil = 'GESTOR' AND ativo = TRUE
  );
$$;

-- 7. SEGURANÇA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_correcao ENABLE ROW LEVEL SECURITY;

-- Políticas para public.usuarios
CREATE POLICY "Leitura de perfil" ON public.usuarios 
    FOR SELECT USING (auth.uid() = id OR public.is_gestor());

CREATE POLICY "Atualização de perfil por Gestor" ON public.usuarios 
    FOR UPDATE USING (public.is_gestor());

-- Políticas para public.registros_ponto
CREATE POLICY "Leitura de registros de ponto" ON public.registros_ponto 
    FOR SELECT USING (usuario_id = auth.uid() OR public.is_gestor());

CREATE POLICY "Inserção direta de registro de ponto" ON public.registros_ponto 
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- Sem políticas de UPDATE/DELETE para registros_ponto (Acesso Negado por padrão)

-- Políticas para public.solicitacoes_correcao
CREATE POLICY "Leitura de solicitações" ON public.solicitacoes_correcao 
    FOR SELECT USING (usuario_id = auth.uid() OR public.is_gestor());

CREATE POLICY "Inserção de solicitações pelo próprio funcionário" ON public.solicitacoes_correcao 
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Cancelamento de solicitação pelo próprio funcionário" ON public.solicitacoes_correcao 
    FOR UPDATE USING (usuario_id = auth.uid() AND status = 'PENDENTE')
    WITH CHECK (status = 'CANCELADO');

-- 8. FUNÇÃO RPC PARA REGISTRO ATÔMICO DE PONTO
CREATE OR REPLACE FUNCTION public.bater_ponto(p_usuario_id UUID)
RETURNS public.registros_ponto
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ultimo_tipo public.tipo_marcacao_enum;
    v_proximo_tipo public.tipo_marcacao_enum;
    v_novo_registro public.registros_ponto;
BEGIN
    IF auth.uid() <> p_usuario_id THEN
        RAISE EXCEPTION 'Acesso negado: Você só pode registrar o seu próprio ponto.';
    END IF;

    -- Bloqueio de linha para evitar concorrência
    SELECT tipo INTO v_ultimo_tipo
    FROM public.registros_ponto
    WHERE usuario_id = p_usuario_id AND desconsiderado = FALSE
    ORDER BY data_hora DESC
    LIMIT 1
    FOR UPDATE;

    IF v_ultimo_tipo IS NULL OR v_ultimo_tipo = 'SAIDA' THEN
        v_proximo_tipo := 'ENTRADA';
    ELSE
        v_proximo_tipo := 'SAIDA';
    END IF;

    INSERT INTO public.registros_ponto (usuario_id, tipo, origem, data_hora)
    VALUES (p_usuario_id, v_proximo_tipo, 'SISTEMA', NOW())
    RETURNING * INTO v_novo_registro;

    RETURN v_novo_registro;
END;
$$;

-- 9. FUNÇÃO RPC PARA ANÁLISE DE SOLICITAÇÃO PELO GESTOR
CREATE OR REPLACE FUNCTION public.analisar_solicitacao(
    p_solicitacao_id UUID,
    p_aprovar BOOLEAN,
    p_motivo_resposta TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_solicitacao public.solicitacoes_correcao%ROWTYPE;
BEGIN
    IF NOT public.is_gestor(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas gestores podem analisar solicitações.';
    END IF;

    SELECT * INTO v_solicitacao
    FROM public.solicitacoes_correcao
    WHERE id = p_solicitacao_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação não encontrada.';
    END IF;

    IF v_solicitacao.status <> 'PENDENTE' THEN
        RAISE EXCEPTION 'Esta solicitação já foi processada ou cancelada.';
    END IF;

    IF v_solicitacao.usuario_id = auth.uid() THEN
        RAISE EXCEPTION 'Operação negada: O gestor não pode analisar a própria solicitação.';
    END IF;

    IF p_aprovar THEN
        UPDATE public.solicitacoes_correcao
        SET status = 'APROVADO',
            analisado_por_id = auth.uid(),
            motivo_resposta = p_motivo_resposta,
            analisado_em = NOW()
        WHERE id = p_solicitacao_id;

        IF v_solicitacao.tipo_solicitacao = 'INCLUSAO' THEN
            INSERT INTO public.registros_ponto (usuario_id, tipo, data_hora, origem)
            VALUES (v_solicitacao.usuario_id, v_solicitacao.tipo_marca_proposta, v_solicitacao.data_hora_proposta, 'AJUSTE_MANUAL');

        ELSIF v_solicitacao.tipo_solicitacao = 'ALTERACAO' THEN
            UPDATE public.registros_ponto
            SET desconsiderado = TRUE
            WHERE id = v_solicitacao.registro_ponto_id;

            INSERT INTO public.registros_ponto (usuario_id, tipo, data_hora, origem)
            VALUES (v_solicitacao.usuario_id, v_solicitacao.tipo_marca_proposta, v_solicitacao.data_hora_proposta, 'AJUSTE_MANUAL');

        ELSIF v_solicitacao.tipo_solicitacao = 'EXCLUSAO' THEN
            UPDATE public.registros_ponto
            SET desconsiderado = TRUE
            WHERE id = v_solicitacao.registro_ponto_id;
        END IF;
    ELSE
        UPDATE public.solicitacoes_correcao
        SET status = 'REJEITADO',
            analisado_por_id = auth.uid(),
            motivo_resposta = p_motivo_resposta,
            analisado_em = NOW()
        WHERE id = p_solicitacao_id;
    END IF;
END;
$$;

-- 10. TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE USUÁRIO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Colaborador'),
    COALESCE((NEW.raw_user_meta_data->>'perfil')::public.perfil_usuario_enum, 'FUNCIONARIO')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
