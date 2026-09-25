import { all, EditalRow, ORDEM_POR_PRAZO } from "@/lib/db";
import { EditalCard, EmptyState, PageHeader, STATUS_META, StatusDot } from "@/components/ui";
import { ScanButton } from "@/components/scan-button";
import Link from "next/link";
import { Search, X } from "lucide-react";

export const dynamic = "force-dynamic";

// Filtro de status em formato de abas: o item ativo ganha superfície e borda.
function filtroClasse(ativo: boolean): string {
  const base =
    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[0.8125rem] font-medium whitespace-nowrap transition-colors";
  return ativo
    ? `${base} bg-surface border-border-strong text-ink`
    : `${base} border-transparent text-muted hover:text-ink hover:bg-surface-2`;
}

export default async function EditaisPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  let sqlText = "SELECT * FROM editais WHERE 1=1";
  const params: unknown[] = [];
  if (status) {
    sqlText += " AND status = ?";
    params.push(status);
  }
  if (q) {
    sqlText += " AND (nome ILIKE ? OR orgao ILIKE ? OR descricao ILIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  // Ordem por prazo de inscrição: abertos primeiro (do mais próximo ao mais
  // distante), depois os sem prazo informado e, por último, os já encerrados
  // (do que fechou mais recentemente para o mais antigo). Empate: maior score.
  sqlText += ORDEM_POR_PRAZO + " LIMIT 200";
  const editais = await all<EditalRow>(sqlText, params);

  const counts = await all<{ status: string; c: number }>(
    "SELECT status, COUNT(*)::int c FROM editais GROUP BY status"
  );
  const byStatus = Object.fromEntries(counts.map((s) => [s.status, s.c]));
  const total = counts.reduce((a, s) => a + s.c, 0);

  return (
    <div>
      <PageHeader
        title="Editais"
        description="Tudo o que o radar captou, ordenado pelo prazo de inscrição: abertos primeiro, encerrados por último."
        actions={<ScanButton />}
      />

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <nav aria-label="Filtrar por status" className="flex flex-wrap items-center gap-1">
            <Link
              href="/editais"
              aria-current={!status ? "page" : undefined}
              className={filtroClasse(!status)}
            >
              Todos
              <span className="num text-faint">{total}</span>
            </Link>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <Link
                key={k}
                href={`/editais?status=${k}`}
                aria-current={status === k ? "page" : undefined}
                className={filtroClasse(status === k)}
              >
                <StatusDot status={k} />
                {v.label}
                <span className="num text-faint">{byStatus[k] ?? 0}</span>
              </Link>
            ))}
          </nav>

          <form action="/editais" role="search" className="relative w-72 max-w-full">
            {status && <input type="hidden" name="status" value={status} />}
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faint"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar por nome, órgão ou texto"
              aria-label="Buscar editais"
              className="input"
              style={{ paddingLeft: "2.125rem", height: "2.25rem" }}
            />
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-[0.8125rem] text-muted">
          <div>
            <span className="num text-ink-2 font-medium">{editais.length}</span> exibidos
            <span aria-hidden className="mx-1.5 text-border-strong">·</span>
            <span className="num">{total}</span> no total
            {q && (
              <>
                <span aria-hidden className="mx-1.5 text-border-strong">·</span>
                busca por <span className="text-ink-2">“{q}”</span>
              </>
            )}
          </div>
          {q && (
            <Link
              href={status ? `/editais?status=${status}` : "/editais"}
              className="link-quiet"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
              Limpar busca
            </Link>
          )}
        </div>

        {editais.length === 0 ? (
          <EmptyState
            title="Nenhum edital encontrado."
            description="Rode uma varredura para buscar oportunidades novas ou ajuste os filtros acima."
          />
        ) : (
          <div>
            <div className="hidden sm:flex items-center gap-4 px-4 pb-2 eyebrow">
              <span className="w-11 shrink-0 text-center">Score</span>
              <span className="flex-1">Edital</span>
              <span>Status · fonte · prazo</span>
            </div>
            <div className="space-y-1.5">
              {editais.map((e) => (
                <EditalCard key={e.id} e={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
