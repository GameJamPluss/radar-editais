import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Layers, Lock, Settings } from "lucide-react";
import { all } from "@/lib/db";
import {
  FONTES_CATALOGO,
  NIVEIS_FONTE,
  FonteCatalogo,
} from "@/lib/fontes-catalogo";
import {
  EMPRESA_META,
  EmptyState,
  NIVEL_ICON,
  PageHeader,
  SectionHeader,
  Stat,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type ContagemFonte = { fonte: string; c: number; ativos: number };

function LinkExterno({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-start gap-1 font-medium text-ink hover:text-accent"
    >
      <span className="min-w-0 break-words">{children}</span>
      <ArrowUpRight
        className="mt-[3px] w-3.5 h-3.5 shrink-0 text-faint group-hover:text-accent"
        aria-hidden
      />
    </a>
  );
}

function Situacao({ cor, children }: { cor: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-2 whitespace-nowrap">
      <span className="dot" style={{ background: cor }} aria-hidden />
      {children}
    </span>
  );
}

function Vazio() {
  return <span className="text-faint">—</span>;
}

function TabelaFontes({
  fontes,
  countByFonte,
}: {
  fontes: FonteCatalogo[];
  countByFonte: Map<string, ContagemFonte>;
}) {
  return (
    <div className="card overflow-x-auto scrollbar-slim">
      <table className="table table-fixed min-w-[780px]">
        <thead>
          <tr>
            <th className="w-[27%]">Plataforma</th>
            <th>Descrição</th>
            <th className="w-[19%]">Usada por</th>
            <th className="w-[15%]">Situação</th>
          </tr>
        </thead>
        <tbody>
          {fontes.map((f) => {
            const cnt = f.fonteSlug ? countByFonte.get(f.fonteSlug) : undefined;
            return (
              <tr key={f.slug}>
                <td>
                  <LinkExterno href={f.url}>{f.nome}</LinkExterno>
                  <div className="mt-0.5 text-xs text-muted">{f.tipo}</div>
                </td>
                <td className="text-ink-2 leading-relaxed">
                  {f.descricao ?? <Vazio />}
                </td>
                <td>
                  {f.empresas && f.empresas.length > 0 ? (
                    <ul className="space-y-0.5 text-ink-2">
                      {f.empresas.map((slug) => (
                        <li key={slug}>{EMPRESA_META[slug] ?? slug}</li>
                      ))}
                    </ul>
                  ) : (
                    <Vazio />
                  )}
                </td>
                <td>
                  {f.noRadar ? (
                    <Situacao cor="var(--color-ok)">No radar</Situacao>
                  ) : (
                    <Situacao cor="var(--color-faint)">Manual</Situacao>
                  )}
                  {cnt ? (
                    <div className="mt-1 text-xs text-muted num">
                      {cnt.c} editais · {cnt.ativos} abertos
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TabelaFeeds({
  feeds,
}: {
  feeds: { nome: string; url: string; ativa: number }[];
}) {
  return (
    <div className="card overflow-x-auto scrollbar-slim">
      <table className="table table-fixed min-w-[640px]">
        <thead>
          <tr>
            <th className="w-[30%]">Feed</th>
            <th>Endereço</th>
            <th className="w-[20%]">Situação</th>
          </tr>
        </thead>
        <tbody>
          {feeds.map((feed, i) => (
            <tr key={i}>
              <td>
                <LinkExterno href={feed.url}>{feed.nome}</LinkExterno>
              </td>
              <td className="text-[0.8125rem] text-muted break-all">{feed.url}</td>
              <td>
                {feed.ativa ? (
                  <Situacao cor="var(--color-ok)">Ativo na varredura</Situacao>
                ) : (
                  <Situacao cor="var(--color-faint)">Pausado</Situacao>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function FontesPage() {
  // contagem ao vivo por fonte (editais.fonte); só a Prosas é varrida hoje
  const counts = await all<{ fonte: string; c: number; ativos: number }>(
    `SELECT fonte, COUNT(*)::int c,
            SUM(CASE WHEN status NOT IN ('descartado','submetido') THEN 1 ELSE 0 END)::int ativos
     FROM editais GROUP BY fonte`
  );
  const countByFonte = new Map(counts.map((c) => [c.fonte, c]));

  const feedsRss = await all<{ nome: string; url: string; ativa: number }>(
    "SELECT nome, url, ativa FROM fontes_rss ORDER BY id"
  );

  const totalEditais = counts.reduce((a, c) => a + c.c, 0);
  const fontesAtivas = FONTES_CATALOGO.filter((f) => f.noRadar).length;
  const feedsAtivos = feedsRss.filter((f) => f.ativa).length;

  return (
    <div>
      <PageHeader
        title="Fontes de editais"
        description="Onde os editais são caçados, catalogado em níveis. A varredura automática roda no agregador (nível 1). Os demais níveis são plataformas que o ecossistema monitora manualmente, mapeadas do Coda."
        actions={
          <Link href="/config" className="btn btn-secondary">
            <Settings aria-hidden />
            Configurar feeds RSS
          </Link>
        }
      />

      <div className="space-y-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Plataformas catalogadas" value={FONTES_CATALOGO.length} />
          <Stat label="Varridas automaticamente" value={fontesAtivas} />
          <Stat label="Editais coletados" value={totalEditais} />
          <Stat
            label="Feeds RSS configurados"
            value={feedsRss.length}
            hint={
              feedsRss.length > 0 ? (
                <span className="num">
                  {feedsAtivos} {feedsAtivos === 1 ? "ativo" : "ativos"} na varredura
                </span>
              ) : undefined
            }
          />
        </div>

        {NIVEIS_FONTE.map((nivel) => {
          const ehRss = nivel.nivel === 5;
          const ehDependencia = nivel.nivel === 6;
          const fontes = ehDependencia
            ? FONTES_CATALOGO.filter((f) => f.dependencia)
            : FONTES_CATALOGO.filter((f) => f.nivel === nivel.nivel && !f.dependencia);
          if (fontes.length === 0 && !ehRss) return null;
          const Icon = NIVEL_ICON[nivel.nivel] ?? Layers;
          return (
            <section key={nivel.nivel} id={`nivel-${nivel.nivel}`}>
              <SectionHeader
                title={
                  <span className="inline-flex items-center gap-2">
                    <Icon className="w-4 h-4 text-faint shrink-0" aria-hidden />
                    <span className="font-normal text-muted num">Nível {nivel.nivel}</span>
                    <span>{nivel.nome}</span>
                  </span>
                }
              />
              <p className="-mt-1.5 mb-4 pl-6 text-sm text-muted leading-relaxed max-w-[72ch]">
                {nivel.descricao}
              </p>

              <div className="space-y-3">
                {fontes.length > 0 && (
                  <TabelaFontes fontes={fontes} countByFonte={countByFonte} />
                )}

                {ehRss && feedsRss.length > 0 && <TabelaFeeds feeds={feedsRss} />}

                {ehRss && feedsRss.length === 0 && (
                  <EmptyState
                    title="Nenhum feed RSS configurado"
                    description="Adicione feeds de newsletters e diários oficiais em Configurações. Eles entram na varredura automática junto com a Prosas."
                    action={
                      <Link href="/config" className="btn btn-secondary btn-sm">
                        <Settings aria-hidden />
                        Abrir configurações
                      </Link>
                    }
                  />
                )}
              </div>
            </section>
          );
        })}

        <div className="border-t border-border pt-5">
          <p className="flex items-start gap-2 text-sm text-muted leading-relaxed max-w-[72ch]">
            <Lock className="mt-[3px] w-3.5 h-3.5 shrink-0 text-faint" aria-hidden />
            <span>
              Os logins e credenciais de cada plataforma continuam no Coda e não
              ficam guardados aqui, por segurança. Esta página é o mapa de{" "}
              <span className="font-medium text-ink-2">onde caçar</span>.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
