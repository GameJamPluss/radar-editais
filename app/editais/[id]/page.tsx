import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CircleAlert,
  CircleCheck,
  CircleX,
  Download,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";
import { all, one, EditalRow } from "@/lib/db";
import {
  StatusBadge,
  ScoreRing,
  fmtData,
  PrazoChip,
  PilarLabel,
  PILAR_META,
  EMPRESA_META,
  PageHeader,
  SectionHeader,
  EmptyState,
  fonteIcon,
} from "@/components/ui";
import { EditalActions } from "@/components/edital-actions";
import { fonteDeEdital } from "@/lib/fontes-catalogo";

export const dynamic = "force-dynamic";

interface Criterio {
  ok: boolean;
  nota: string;
}

const CRITERIO_LABEL: Record<string, string> = {
  localizacao: "Localização do CNPJ",
  competencias: "Competências e escopo",
  historico: "Disponibilidade de histórico",
  pasta: "Pasta da secretaria",
};

const MODO_ANALISE: Record<string, string> = {
  claude: "Claude",
  "claude-api": "Claude · API",
  "claude-assinatura": "Claude · assinatura",
  heuristica: "Heurística",
};

/** Linha da lista de fatos da coluna lateral. */
function Fato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3 px-5 py-3">
      <dt className="text-[0.8125rem] text-muted">{label}</dt>
      <dd className="text-sm text-ink-2 min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function EditalDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await one<EditalRow>("SELECT * FROM editais WHERE id = ?", [id]);
  if (!e) notFound();

  const propostas = await all<{
    id: number;
    titulo: string;
    modo: string;
    status: string;
    criado_em: string;
  }>(
    "SELECT id, titulo, modo, status, criado_em FROM propostas WHERE edital_id = ? ORDER BY id DESC",
    [id]
  );

  const eleg = e.elegibilidade
    ? (JSON.parse(e.elegibilidade) as Record<string, Criterio>)
    : null;
  const briefing = e.briefing
    ? (JSON.parse(e.briefing) as { documentos: string[]; requisitos: string[] })
    : null;
  const areas = e.areas ? (JSON.parse(e.areas) as string[]) : [];
  const pilar = e.pilar_slug ? PILAR_META[e.pilar_slug] : null;
  const fonte = fonteDeEdital(e.fonte);
  const FonteIcon = fonteIcon(fonte.slug);

  const criterios = eleg ? Object.entries(eleg) : [];
  const criteriosOk = criterios.filter(([, v]) => v.ok).length;
  const semAnalise = !e.analise_resumo && !eleg && !briefing;

  const inscricoes =
    e.inicio_inscricoes && e.fim_inscricoes
      ? `${fmtData(e.inicio_inscricoes)} a ${fmtData(e.fim_inscricoes)}`
      : e.fim_inscricoes
        ? `Até ${fmtData(e.fim_inscricoes)}`
        : e.inicio_inscricoes
          ? `A partir de ${fmtData(e.inicio_inscricoes)}`
          : null;

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link
            href="/editais"
            className="inline-flex items-center gap-1 transition-colors hover:text-accent"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Editais
          </Link>
        }
        title={e.nome}
        description={e.orgao ?? "Órgão não informado"}
        actions={
          <>
            {e.url && (
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-quiet"
              >
                Edital original
                <ExternalLink aria-hidden />
              </a>
            )}
            <EditalActions editalId={e.id} status={e.status} />
          </>
        }
      />

      <div className="grid items-start gap-10 lg:grid-cols-12">
        {/* ---------- coluna principal ---------- */}
        <div className="min-w-0 space-y-10 lg:col-span-8">
          {e.motivo_descarte && (
            <div className="rounded-[10px] border border-border bg-danger-soft px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-danger">
                <Ban className="w-4 h-4" aria-hidden />
                Motivo do descarte
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2 max-w-[68ch]">
                {e.motivo_descarte}
              </p>
            </div>
          )}

          {semAnalise && (
            <EmptyState
              title="Este edital ainda não foi analisado."
              description="Use Analisar match para calcular o score, checar a elegibilidade e montar o briefing de escrita."
            />
          )}

          {e.analise_resumo && (
            <section>
              <SectionHeader
                title={
                  <>
                    Análise
                    <span className="ml-2 text-xs font-normal text-muted">
                      {MODO_ANALISE[e.analise_modo ?? "heuristica"] ?? e.analise_modo}
                      <span aria-hidden className="mx-1.5 text-border-strong">·</span>
                      <span className="num">{fmtData(e.analisado_em)}</span>
                    </span>
                  </>
                }
              />
              <p className="text-[0.9375rem] leading-relaxed text-ink-2 max-w-[68ch]">
                {e.analise_resumo}
              </p>
            </section>
          )}

          {eleg && (
            <section>
              <SectionHeader title="Elegibilidade e match" />
              <ul className="card divide-y divide-border">
                {criterios.map(([k, v]) => (
                  <li key={k} className="flex items-start gap-3 px-5 py-3.5">
                    {v.ok ? (
                      <CircleCheck className="mt-0.5 w-4 h-4 shrink-0 text-ok" aria-hidden />
                    ) : (
                      <CircleX className="mt-0.5 w-4 h-4 shrink-0 text-danger" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                        <span className="text-sm font-medium text-ink">
                          {CRITERIO_LABEL[k] ?? k}
                        </span>
                        <span
                          className={`text-xs font-medium ${v.ok ? "text-ok" : "text-danger"}`}
                        >
                          {v.ok ? "Atende" : "Não atende"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted max-w-[68ch]">
                        {v.nota}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {briefing && (
            <section>
              <SectionHeader title="Briefing de escrita" />
              <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                <div>
                  <div className="eyebrow mb-2.5">
                    Documentação
                    <span className="num ml-1.5 text-faint">{briefing.documentos.length}</span>
                  </div>
                  <ol className="space-y-2">
                    {briefing.documentos.map((d, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                        <span className="num w-5 shrink-0 text-right text-faint">{i + 1}</span>
                        <span className="min-w-0">{d}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="eyebrow mb-2.5">
                    Requisitos da proposta
                    <span className="num ml-1.5 text-faint">{briefing.requisitos.length}</span>
                  </div>
                  <ol className="space-y-2">
                    {briefing.requisitos.map((r, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                        <span className="num w-5 shrink-0 text-right text-faint">{i + 1}</span>
                        <span className="min-w-0">{r}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          )}

          {e.descricao && (
            <section>
              <SectionHeader title="Descrição e regulamento" />
              <div className="prose-edital">
                <p className="whitespace-pre-wrap" style={{ marginTop: 0 }}>
                  {e.descricao}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* ---------- coluna lateral ---------- */}
        <aside className="min-w-0 space-y-10 lg:col-span-4">
          <section className="card" aria-label="Resumo do edital">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <ScoreRing score={e.score} />
              <div>
                <div className="text-sm font-medium text-ink">Score de match</div>
                <div className="text-xs text-muted num">
                  {e.score === null ? "Ainda sem score" : `${e.score} de 100`}
                </div>
              </div>
            </div>
            <dl className="divide-y divide-border">
              <Fato label="Status">
                <StatusBadge status={e.status} />
              </Fato>
              <Fato label="Pilar">
                {pilar ? <PilarLabel slug={e.pilar_slug} /> : "—"}
              </Fato>
              <Fato label="Empresa">
                {e.empresa_slug ? (EMPRESA_META[e.empresa_slug] ?? e.empresa_slug) : "—"}
              </Fato>
              <Fato label="Inscrições">
                {inscricoes && <div className="num">{inscricoes}</div>}
                <div className={inscricoes ? "mt-0.5" : undefined}>
                  <PrazoChip fim={e.fim_inscricoes} />
                </div>
              </Fato>
              <Fato label="Valor">
                {e.valor_total ? (
                  <span className="num text-ink">
                    {`${e.moeda ?? "R$"} ${Number(e.valor_total).toLocaleString("pt-BR")}`}
                  </span>
                ) : (
                  <span className="text-muted">Não informado</span>
                )}
              </Fato>
              <Fato label="Encontrado em">
                <span
                  className="inline-flex items-center gap-1.5"
                  title="Plataforma onde o radar encontrou este edital"
                >
                  <FonteIcon className="w-3.5 h-3.5 shrink-0 text-faint" aria-hidden />
                  {fonte.url ? (
                    <a
                      href={fonte.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 transition-colors hover:text-accent"
                    >
                      {fonte.nome}
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                    </a>
                  ) : (
                    fonte.nome
                  )}
                </span>
              </Fato>
              {areas.length > 0 && <Fato label="Áreas">{areas.join(", ")}</Fato>}
              {eleg && (
                <Fato label="Elegibilidade">
                  <span className="num">
                    {criteriosOk} de {criterios.length}
                  </span>{" "}
                  critérios atendidos
                </Fato>
              )}
              <Fato label="Prazo viável">
                {e.prazo_viavel === null ? (
                  "—"
                ) : e.prazo_viavel ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CircleCheck className="w-3.5 h-3.5 text-ok" aria-hidden />
                    Sim
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CircleX className="w-3.5 h-3.5 text-danger" aria-hidden />
                    Não
                  </span>
                )}
                <div className="mt-0.5 text-xs text-faint">Mínimo de 10 dias para a escrita</div>
              </Fato>
            </dl>
          </section>

          <section>
            <SectionHeader title="Propostas" count={propostas.length} />
            {propostas.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted">
                Nenhuma proposta gerada. Use Gerar proposta: o rascunho parte do banco de
                textos do pilar correspondente.
              </p>
            ) : (
              <ul className="card divide-y divide-border">
                {propostas.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/propostas/${p.id}`}
                        className="block truncate text-sm font-medium text-ink transition-colors hover:text-accent"
                      >
                        Proposta <span className="num">#{p.id}</span>
                      </Link>
                      <div className="mt-0.5 text-xs text-muted">
                        {p.status === "gerando" ? "gerando" : p.modo}
                        <span aria-hidden className="mx-1.5 text-border-strong">·</span>
                        <span className="num">{fmtData(p.criado_em)}</span>
                      </div>
                    </div>
                    {p.status === "pronta" ? (
                      <a
                        href={`/api/propostas/${p.id}/docx`}
                        className="btn btn-secondary btn-sm shrink-0"
                      >
                        <Download aria-hidden />
                        .docx
                      </a>
                    ) : p.status === "gerando" ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
                        <LoaderCircle className="spin w-3.5 h-3.5" aria-hidden />
                        Escrevendo
                      </span>
                    ) : p.status === "erro" ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-danger">
                        <CircleAlert className="w-3.5 h-3.5" aria-hidden />
                        Falhou
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-faint">—</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
