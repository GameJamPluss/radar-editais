import Link from "next/link";
import { all, one, EditalRow } from "@/lib/db";
import { STATUS_META, ScoreRing, PrazoChip } from "@/components/ui";

export const dynamic = "force-dynamic";

const COLUNAS = ["radar", "triagem", "match", "com-dependencia", "escrita", "submetido"];

// Na coluna "match" só entram os editais com score ACIMA de 50 — abaixo disso
// o match costuma ser falso positivo da triagem por palavras-chave. As outras
// colunas continuam mostrando tudo. Os ocultos seguem em /editais?status=match.
const SCORE_MIN_MATCH = 50;

export default async function PipelinePage() {
  const editais = await all<EditalRow>(
    `SELECT * FROM editais WHERE status != 'descartado'
     ORDER BY score DESC NULLS LAST, fim_inscricoes ASC`
  );

  const porColuna = new Map<string, EditalRow[]>(COLUNAS.map((c) => [c, []]));
  for (const e of editais) {
    if (e.status === "match" && (e.score ?? 0) <= SCORE_MIN_MATCH) continue;
    porColuna.get(e.status)?.push(e);
  }

  const descartados = (await one<{ c: number }>(
    "SELECT COUNT(*)::int c FROM editais WHERE status = 'descartado'"
  ))!;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">🗂️ Pipeline</h1>
        <p className="text-muted mt-1">
          Do radar à submissão — o fluxograma vivo.{" "}
          <Link href="/editais?status=descartado" className="hover:text-ink underline">
            {descartados.c} descartado(s)
          </Link>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {COLUNAS.map((col) => {
          const meta = STATUS_META[col];
          const items = porColuna.get(col) ?? [];
          return (
            <div key={col} className="card p-3 min-h-40">
              <div className="flex items-center justify-between px-1 pb-3">
                <div className="font-bold text-sm">
                  {meta.emoji} {meta.label}
                  {col === "match" && (
                    <span className="ml-1.5 text-[10px] font-normal text-muted">
                      score &gt; {SCORE_MIN_MATCH}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((e) => (
                  <Link
                    key={e.id}
                    href={`/editais/${e.id}`}
                    className="block rounded-xl border border-border bg-surface-2 p-3 hover:border-neon transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <ScoreRing score={e.score} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-snug line-clamp-3">
                          {e.nome}
                        </div>
                        <div className="text-[11px] text-muted truncate mt-1">
                          {e.orgao ?? "—"}
                        </div>
                        <PrazoChip fim={e.fim_inscricoes} />
                      </div>
                    </div>
                  </Link>
                ))}
                {items.length === 0 && (
                  <div className="text-xs text-muted text-center py-6">vazio</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
