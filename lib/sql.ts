// Cliente Postgres (Supabase) — singleton reutilizado entre invocações
// serverless. Usa o pooler em modo transação (prepare:false).
//
// Helpers no estilo better-sqlite3 para minimizar a reescrita dos callers:
//   await one`...`  → primeira linha (ou undefined)
//   await all`...`  → array de linhas
//   await run(text, params) / one(text, params) / all(text, params)
// Aceita tanto tagged template quanto (texto, params[]) com placeholders `?`.

import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

export function sql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente (Supabase).");
  // banco local de desenvolvimento (localhost) não usa SSL; Supabase exige
  const local = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
  _sql = postgres(url, {
    prepare: false, // pooler em modo transação
    ssl: local ? false : "require",
    max: 5,
    idle_timeout: 20,
  });
  return _sql;
}

// converte placeholders estilo SQLite (?) para Postgres ($1, $2, ...)
function toPg(text: string): string {
  let i = 0;
  return text.replace(/\?/g, () => "$" + ++i);
}

export async function all<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const rows = await sql().unsafe(toPg(text), params as never[]);
  return rows as unknown as T[];
}

export async function one<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await all<T>(text, params);
  return rows[0];
}

export async function run(
  text: string,
  params: unknown[] = []
): Promise<Record<string, unknown>[]> {
  return all(text, params);
}
