import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { all, one, EditalRow } from "@/lib/db";
import { modoIaInfo } from "@/lib/analysis/analyzer";
import { ScanButton } from "@/components/scan-button";
import {
  diasRestantes,
  EditalCard,
  EmptyState,
  fmtData,
  PageHeader,
  PrazoChip,
  SectionHeader,
  Stat,
  StatusDot,
  STATUS_META,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";

const FLUXO: { status: string; nome: string; desc: string }[] = [
  { status: "radar", nome: "Radar", desc: "Varredura semanal e sob demanda" },
  { status: "triagem", nome: "Triagem", desc: "Leitura do regulamento" },
  { status: "match", nome: "Match", desc: "4 pilares e elegibilidade" },
  { status: "escrita", nome: "Escrita", desc: "Proposta com o banco de textos" },
  { status: "submetido", nome: "Submetido", desc: "Acompanhamento do resultado" },
];

const ORIGEM: Record<string, string> = {
  agendada: "agendada",
  manual: "manual",
  telegram: "pelo Telegram",
};

function plural(n: number, um: string, varios: string) {
  return n === 1 ? `1 ${um}` : `${n} ${varios}`;
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Mesma leitura de data de fmtData (calendário de São Paulo; "só a data" não
// vira meia-noite UTC), quebrada em dia e mês para a coluna de prazos.
function partesData(iso: string | null) {
  if (!iso) return null;
  const soData = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = new Date(soData ? `${iso}T12:00:00-03:00` : iso);
  if (isNaN(d.getTime())) return null;
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("pt-BR", { ...o, timeZone: TZ });
  return {
    dia: f({ day: "2-digit" }),
    mes: f({ month: "short" }).replace(/\./g, ""),
    ano: Number(f({ year: "numeric" })),
  };
}

function fmtDataHora(v: string) {
  const d = new Date(v);
  if (isNaN(d.getTime())) return fmtData(v);
  const data = d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: TZ })
    .replace(/\./g, "");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `${data}, ${hora}`;
}

export default async function Dashboard() {
  const stats = await all<{ status: string; c: number }>(
    "SELECT status, COUNT(*)::int c FROM editais GROUP BY status"
  );
  const byStatus = Object.fromEntries(stats.map((s) => [s.status, s.c]));
  const total = stats.reduce((a, s) => a + s.c, 0);

  // o banco compara em UTC; o corte final (prazo com hora que já passou,
  // virada do dia no Brasil) é feito por diasRestantes, no fuso de São Paulo
  const proximosPrazos = (
    await all<EditalRow>(
      `SELECT * FROM editais
       WHERE status NOT IN ('descartado','submetido')
         AND fim_inscricoes IS NOT NULL
         AND fim_inscricoes::date >= current_date - 1
       ORDER BY fim_inscricoes::date ASC LIMIT 12`
    )
  )
    .filter((e) => (diasRestantes(e.fim_inscricoes) ?? -1) >= 0)
    .slice(0, 6);

  const topMatches = await all<EditalRow>(
    `SELECT * FROM editais
     WHERE status NOT IN ('descartado','submetido') AND score IS NOT NULL
     ORDER BY score DESC LIMIT 6`
  );

  const ultimaVarredura = await one<{
    iniciada_em: string;
    origem: string;
    novos: number;
    total_encontrados: number;
  }>("SELECT * FROM varreduras ORDER BY id DESC LIMIT 1");

  const ia = await modoIaInfo();
  const telegram = Boolean(process.env.TELEGRAM_BOT_TOKEN);

  const qtd = (status: string): number => byStatus[status] ?? 0;
  const anoAtual = new Date().getFullYear();
  const hoje = capitalizar(
    new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: TZ,
    })
  );
  const foraDoFluxo = [
    { status: "com-dependencia", n: qtd("com-dependencia") },
    { status: "descartado", n: qtd("descartado") },
  ].filter((f) => f.n > 0);

  return (
    <div>
      <PageHeader
        eyebrow={hoje}
        title="Visão geral"
        description="Monitoramento semanal de editais para GameJam+, Indie Hero e Plug and Plus."
        actions={<ScanButton />}
      />

      <div className="space-y-10">
        {/* indicadores + estado do sistema */}
        <section
          aria-label="Indicadores"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.25fr)]"
        >
          <Stat
            label="Editais no radar"
            value={total}
            hint={
              ultimaVarredura
                ? `${plural(ultimaVarredura.novos ?? 0, "novo", "novos")} na última varredura`
                : "Nenhuma varredura ainda"
            }
          />
          <Stat
            label="Com match"
            value={qtd("match")}
            hint={
              qtd("com-dependencia") > 0
                ? `Mais ${qtd("com-dependencia")} com dependência`
                : undefined
            }
          />
          <Stat
            label="Em escrita ou submetidos"
            value={qtd("escrita") + qtd("submetido")}
            hint={`${qtd("escrita")} em escrita · ${plural(qtd("submetido"), "submetido", "submetidos")}`}
          />

          <div className="rounded-[10px] border border-border px-4 py-3.5">
            <div className="eyebrow">Sistema</div>
            <dl className="mt-2.5 space-y-2 text-[0.8125rem]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted shrink-0">Análise</dt>
                <dd className="flex items-center gap-2 text-ink-2 text-right min-w-0">
                  <span
                    className="dot"
                    style={{
                      background:
                        ia.resolvido === "heuristica" ? "var(--color-faint)" : "var(--color-ok)",
                    }}
                    aria-hidden
                  />
                  <span className="truncate">{capitalizar(ia.rotulo)}</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted shrink-0">Telegram</dt>
                <dd className="flex items-center gap-2 text-ink-2">
                  <span
                    className="dot"
                    style={{ background: telegram ? "var(--color-ok)" : "var(--color-warn)" }}
                    aria-hidden
                  />
                  {telegram ? "Ativo" : "Configurar token"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted shrink-0">Última varredura</dt>
                <dd className="text-ink-2 text-right num">
                  {ultimaVarredura ? (
                    <>
                      {fmtDataHora(ultimaVarredura.iniciada_em)}
                      <span className="block text-muted">
                        {plural(ultimaVarredura.total_encontrados ?? 0, "encontrado", "encontrados")}
                        {ultimaVarredura.origem && (
                          <> · {ORIGEM[ultimaVarredura.origem] ?? ultimaVarredura.origem}</>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">Nenhuma ainda</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* prazos + matches */}
        <div className="grid gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section>
            <SectionHeader title="Próximos prazos" href="/editais" linkLabel="Ver todos" />
            {proximosPrazos.length === 0 ? (
              <EmptyState
                title="Nenhum edital com prazo aberto"
                description="Rode uma varredura em Varrer agora para buscar inscrições abertas."
              />
            ) : (
              <ol className="card overflow-hidden divide-y divide-border">
                {proximosPrazos.map((e) => {
                  const p = partesData(e.fim_inscricoes);
                  const status = STATUS_META[e.status] ?? STATUS_META.radar;
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/editais/${e.id}`}
                        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2/60"
                      >
                        <time
                          dateTime={e.fim_inscricoes ?? undefined}
                          title={fmtData(e.fim_inscricoes)}
                          className="w-11 shrink-0 text-center leading-none"
                        >
                          {p ? (
                            <>
                              <span className="block text-[1.125rem] font-semibold num text-ink">
                                {p.dia}
                              </span>
                              <span className="block mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted">
                                {p.mes}
                                {p.ano !== anoAtual && <span className="num"> {p.ano}</span>}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted">{fmtData(e.fim_inscricoes)}</span>
                          )}
                        </time>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-ink truncate">{e.nome}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[0.8125rem] text-muted min-w-0">
                            <span className="truncate">{e.orgao ?? "Órgão não informado"}</span>
                            <span aria-hidden className="text-border-strong">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1.5 shrink-0">
                              <StatusDot status={e.status} />
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <PrazoChip fim={e.fim_inscricoes} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section>
            <SectionHeader title="Melhores matches" href="/pipeline" linkLabel="Ver pipeline" />
            {topMatches.length === 0 ? (
              <EmptyState
                title="Nenhum edital analisado ainda"
                description="Os editais com score aparecem aqui depois da triagem."
              />
            ) : (
              <div className="space-y-2">
                {topMatches.map((e) => (
                  <EditalCard key={e.id} e={e} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* fluxo */}
        <section>
          <SectionHeader title="O fluxo de trabalho" />
          <div className="card">
            <ol className="grid grid-cols-1 divide-y divide-border lg:grid-cols-5 lg:divide-y-0">
              {FLUXO.map((f, i) => (
                <li key={f.status} className="flex items-stretch min-w-0">
                  <div className="flex-1 min-w-0 px-5 py-4">
                    <div className="text-[0.6875rem] font-medium num text-faint">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <StatusDot status={f.status} />
                        {f.nome}
                      </span>
                      <span className="text-sm font-semibold num text-ink-2">
                        {qtd(f.status)}
                        <span className="sr-only"> editais</span>
                      </span>
                    </div>
                    <p className="mt-1 text-[0.8125rem] leading-snug text-muted">{f.desc}</p>
                  </div>
                  {i < FLUXO.length - 1 && (
                    <ChevronRight
                      className="hidden lg:block self-center w-4 h-4 shrink-0 -mx-2 text-border-strong"
                      aria-hidden
                    />
                  )}
                </li>
              ))}
            </ol>
            {foraDoFluxo.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-5 py-2.5 text-[0.8125rem] text-muted">
                <span>Fora do fluxo principal:</span>
                {foraDoFluxo.map((f) => (
                  <span key={f.status} className="inline-flex items-center gap-1.5">
                    <StatusDot status={f.status} />
                    {STATUS_META[f.status]?.label}
                    <span className="num text-ink-2">{f.n}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
