// Camada de dados — Postgres (Supabase) via lib/sql.
// O schema e o seed são aplicados pelo scripts/migrate-to-supabase.mjs
// (e por db/schema.sql). Aqui ficam só os helpers de config e os tipos.

import { all, one, run, sql } from "./sql";

export { all, one, run, sql };

export async function getConfig(chave: string): Promise<string | null> {
  const row = await one<{ valor: string }>(
    "SELECT valor FROM config WHERE chave = ?",
    [chave]
  );
  return row?.valor ?? null;
}

export async function setConfig(chave: string, valor: string): Promise<void> {
  await run(
    "INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor",
    [chave, valor]
  );
}

// Ordenação padrão da listagem de editais: pelo prazo de inscrição.
// 1) abertos (prazo hoje ou à frente), do mais próximo ao mais distante;
// 2) sem prazo informado; 3) encerrados, do que fechou mais recentemente
// para o mais antigo. Empate dentro do grupo → maior score primeiro.
// NULLIF(...,'') protege contra prazo vazio no cast para date.
export const ORDEM_POR_PRAZO = `
  ORDER BY
    CASE
      WHEN NULLIF(fim_inscricoes, '') IS NULL THEN 1
      WHEN NULLIF(fim_inscricoes, '')::date >= CURRENT_DATE THEN 0
      ELSE 2
    END ASC,
    CASE WHEN NULLIF(fim_inscricoes, '')::date >= CURRENT_DATE
         THEN NULLIF(fim_inscricoes, '')::date END ASC NULLS LAST,
    CASE WHEN NULLIF(fim_inscricoes, '')::date <  CURRENT_DATE
         THEN NULLIF(fim_inscricoes, '')::date END DESC NULLS LAST,
    score DESC NULLS LAST`;

export interface EditalRow {
  id: number;
  fonte: string;
  fonte_id: string | null;
  nome: string;
  orgao: string | null;
  url: string | null;
  descricao: string | null;
  valor_total: string | null;
  moeda: string | null;
  inicio_inscricoes: string | null;
  fim_inscricoes: string | null;
  areas: string | null;
  uf: string | null;
  status: string;
  motivo_descarte: string | null;
  analisado_em: string | null;
  analise_modo: string | null;
  score: number | null;
  pilar_slug: string | null;
  empresa_slug: string | null;
  pasta: string | null;
  elegibilidade: string | null;
  prazo_viavel: number | null;
  analise_resumo: string | null;
  briefing: string | null;
  criado_em: string;
  atualizado_em: string;
}
