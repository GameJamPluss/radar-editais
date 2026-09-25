import Link from "next/link";
import { ArrowRight, ChevronRight, LoaderCircle } from "lucide-react";
import { all } from "@/lib/db";
import {
  PILAR_META,
  EMPRESA_META,
  fmtData,
  PageHeader,
  PilarLabel,
  EmptyState,
} from "@/components/ui";

export const dynamic = "force-dynamic";

// `dot` é a cor do ponto de status (variável do tema em app/globals.css).
const PROP_META: Record<string, { label: string; dot: string }> = {
  pronta: { label: "Pronta", dot: "var(--color-ok)" },
  gerando: { label: "Escrevendo", dot: "var(--color-warn)" },
  erro: { label: "Erro", dot: "var(--color-danger)" },
};

interface Row {
  id: number;
  proposta_status: string;
  modo: string | null;
  criado_em: string;
  edital_id: number;
  edital_nome: string;
  orgao: string | null;
  edital_status: string;
  empresa_slug: string | null;
  pilar_slug: string | null;
}

function PropostaStatus({ status }: { status: string }) {
  const pm = PROP_META[status] ?? PROP_META.pronta;
  return (
    <span className="inline-flex items-center gap-2 text-[0.8125rem] text-ink-2">
      {status === "gerando" ? (
        <LoaderCircle className="w-3.5 h-3.5 spin text-warn" aria-hidden />
      ) : (
        <span className="dot" style={{ background: pm.dot }} aria-hidden />
      )}
      {pm.label}
    </span>
  );
}

const COLS = "md:grid-cols-[minmax(0,1fr)_11rem_7.5rem_8rem_1rem]";

export default async function PropostasPage() {
  // uma linha por EDITAL escrito (a proposta mais recente de cada), mais novo primeiro
  const rows = await all<Row>(
    `SELECT DISTINCT ON (e.id)
       p.id, p.status AS proposta_status, p.modo, p.criado_em,
       e.id AS edital_id, e.nome AS edital_nome, e.orgao, e.status AS edital_status,
       e.empresa_slug, e.pilar_slug
     FROM propostas p JOIN editais e ON e.id = p.edital_id
     ORDER BY e.id, p.criado_em DESC`
  );
  rows.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const prontas = rows.filter((r) => r.proposta_status === "pronta").length;

  const totalTxt = rows.length === 1 ? "1 edital" : `${rows.length} editais`;
  const prontasTxt = prontas === 1 ? "1 pronta" : `${prontas} prontas`;
  const descricao =
    rows.length === 0
      ? "Editais com proposta redigida aparecem aqui, com a versão mais recente de cada."
      : `${totalTxt} com proposta redigida${prontas ? `, ${prontasTxt}` : ""}. Cada linha mostra a versão mais recente.`;

  return (
    <div>
      <PageHeader title="Propostas" description={descricao} />

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma proposta escrita ainda"
          description="Abra um edital e use Gerar proposta. O rascunho aparece aqui assim que a escrita começar."
          action={
            <Link href="/editais" className="btn btn-secondary">
              Ver editais
              <ArrowRight aria-hidden />
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div
            className={`hidden md:grid ${COLS} gap-x-6 px-5 py-2.5 border-b border-border bg-surface-2 eyebrow`}
            aria-hidden
          >
            <span>Edital</span>
            <span>Pilar</span>
            <span>Status</span>
            <span>Gerada em</span>
            <span />
          </div>

          <ul>
            {rows.map((r) => {
              const pilar = r.pilar_slug ? PILAR_META[r.pilar_slug] : null;
              return (
                <li key={r.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/propostas/${r.id}`}
                    className={`group grid grid-cols-[minmax(0,1fr)_auto] ${COLS} items-center gap-x-6 gap-y-1 px-5 py-3.5 transition-colors hover:bg-surface-2`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate transition-colors group-hover:text-accent">
                        {r.edital_nome}
                      </div>
                      <div className="mt-0.5 text-[0.8125rem] text-muted truncate">
                        {r.orgao ?? "Órgão não informado"}
                        {r.empresa_slug && (
                          <>
                            <span aria-hidden className="mx-1.5 text-border-strong">
                              ·
                            </span>
                            {EMPRESA_META[r.empresa_slug] ?? r.empresa_slug}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:block min-w-0 truncate text-[0.8125rem] text-ink-2">
                      {pilar ? <PilarLabel slug={r.pilar_slug} /> : <span className="text-faint">—</span>}
                    </div>

                    <div>
                      <PropostaStatus status={r.proposta_status} />
                    </div>

                    <div className="hidden md:block">
                      <div className="num text-[0.8125rem] text-ink-2">{fmtData(r.criado_em)}</div>
                      {r.modo && <div className="mt-0.5 text-xs text-faint">via {r.modo}</div>}
                    </div>

                    <ChevronRight
                      className="hidden md:block w-4 h-4 text-faint transition-colors group-hover:text-ink-2"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
