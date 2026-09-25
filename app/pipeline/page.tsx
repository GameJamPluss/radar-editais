import Link from "next/link";
import { Archive } from "lucide-react";
import { all, one, EditalRow } from "@/lib/db";
import { STATUS_META, StatusDot, PrazoChip, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const COLUNAS = ["radar", "triagem", "match", "com-dependencia", "escrita", "submetido"];

// Na coluna "match" só entram os editais com score ACIMA de 50. Abaixo disso
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
    <div>
      <PageHeader
        title="Pipeline"
        description="Do radar à submissão. Em cada etapa, os editais de maior score aparecem primeiro."
        actions={
          <Link
            href="/editais?status=descartado"
            className="btn btn-secondary"
            title="Ver editais descartados"
          >
            <Archive aria-hidden />
            Descartados
            <span className="num text-muted">{descartados.c}</span>
          </Link>
        }
      />

      <div className="grid grid-flow-col auto-cols-[minmax(11rem,1fr)] items-start gap-3 overflow-x-auto scrollbar-slim pb-2">
        {COLUNAS.map((col) => {
          const meta = STATUS_META[col];
          const items = porColuna.get(col) ?? [];
          return (
            <section
              key={col}
              aria-label={`${meta.label}, ${items.length} editais`}
              className="flex flex-col min-h-48 max-h-[calc(100vh-15rem)] rounded-[10px] border border-border bg-surface-2"
            >
              <header className="flex items-center gap-2 px-3 pt-3 pb-2.5">
                <StatusDot status={col} />
                <h2 className="eyebrow shrink-0">{meta.label}</h2>
                {col === "match" && (
                  <span
                    className="tag num h-[1.125rem] px-1.5 text-[0.6875rem] min-w-0"
                    title={`Só entram editais com score acima de ${SCORE_MIN_MATCH}. Os demais seguem em Editais, filtro Match.`}
                  >
                    score &gt; {SCORE_MIN_MATCH}
                  </span>
                )}
                <span className="ml-auto num text-xs font-medium text-muted">
                  {items.length}
                </span>
              </header>

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-2 pb-2 space-y-1.5">
                {items.map((e) => (
                  <Link
                    key={e.id}
                    href={`/editais/${e.id}`}
                    title={e.nome}
                    className="block rounded-[7px] border border-border bg-surface px-3 py-2.5 transition-colors hover:border-border-strong"
                  >
                    <div className="text-[0.8125rem] font-medium leading-snug text-ink line-clamp-2">
                      {e.nome}
                    </div>
                    <div className="mt-1 text-xs text-muted truncate">
                      {e.orgao ?? "Órgão não informado"}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <PrazoChip fim={e.fim_inscricoes} />
                      <span
                        className="num text-xs text-faint shrink-0"
                        title={e.score === null ? "Sem score" : `Score ${e.score} de 100`}
                      >
                        {e.score === null ? (
                          "—"
                        ) : (
                          <>
                            <span className="font-semibold text-ink-2">{e.score}</span>/100
                          </>
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-faint">Nenhum edital</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
