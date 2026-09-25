import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { all } from "@/lib/db";
import { resumoHistorico, foiAprovado } from "@/lib/coda/import";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

interface Empresa {
  slug: string;
  razao_social: string;
  nome_fantasia: string;
  apelido: string;
  cnpj: string;
  data_abertura: string;
  porte: string;
  situacao: string;
  municipio: string;
  uf: string;
  uf_ficha_tecnica: string | null;
  observacao_endereco: string | null;
  representante_legal: string | null;
  cnae_principal: string;
  cnaes_secundarios: string;
  apresentacao: string;
  portfolio: string;
  clientes: string;
  parceiros: string;
  metricas: string;
  tags: string;
}

/* ---------- formatação local (só apresentação) ---------- */

// "2021-03-31" -> "31/03/2021", no formato que os formulários pedem.
function dataBR(iso: string | null): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

// "85.99-6-04 - Treinamento em ..." -> código + descrição
function separaCnae(c: string): { codigo: string | null; descricao: string } {
  const m = /^([\d./-]+)\s+-\s+(.+)$/.exec(c.trim());
  return m ? { codigo: m[1], descricao: m[2] } : { codigo: null, descricao: c };
}

// "Nome do projeto (travessão) descrição" -> nome + descrição
function separaItem(p: string): { nome: string; detalhe: string | null } {
  const partes = p.split(/\s+[\u2013\u2014]\s+/);
  if (partes.length < 2) return { nome: p, detalhe: null };
  return { nome: partes[0], detalhe: partes.slice(1).join(", ") };
}

// Remove emoji que venha do banco (ex.: prefixo de alerta).
function semEmoji(s: string): string {
  return s.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "").trim();
}

function capitalizar(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function listaSegura(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

/* ---------- blocos ---------- */

function Campo({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-0.5 px-5 py-2.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:items-baseline">
      <dt className="text-[0.8125rem] text-muted">{label}</dt>
      <dd className="text-sm text-ink min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: ReactNode; children: ReactNode }) {
  return (
    <div>
      <h3 className="eyebrow mb-2">{titulo}</h3>
      {children}
    </div>
  );
}

function Marcador() {
  return (
    <span aria-hidden className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-border-strong" />
  );
}

export default async function EmpresasPage() {
  const empresas = await all<Empresa>("SELECT * FROM empresas ORDER BY id");

  // pré-busca o track record (Coda) de cada empresa
  const hists = new Map<string, Awaited<ReturnType<typeof resumoHistorico>>>();
  await Promise.all(
    empresas.map(async (e) => hists.set(e.slug, await resumoHistorico(e.slug)))
  );

  return (
    <div>
      <PageHeader
        title="Empresas e CNPJs"
        description="As três frentes do ecossistema. O motor de match escolhe a executora certa para cada edital. Os dados cadastrais estão prontos para copiar nos formulários."
        actions={
          empresas.length > 1 ? (
            <nav aria-label="Ir para a empresa" className="flex flex-wrap gap-2">
              {empresas.map((e) => (
                <a key={e.slug} href={`#${e.slug}`} className="btn btn-secondary btn-sm">
                  {e.apelido}
                </a>
              ))}
            </nav>
          ) : undefined
        }
      />

      <div className="space-y-12">
        {empresas.map((e, idx) => {
          const cnaes = JSON.parse(e.cnaes_secundarios) as string[];
          const metricas = JSON.parse(e.metricas) as string[];
          const portfolio = JSON.parse(e.portfolio) as string[];
          const clientes = JSON.parse(e.clientes) as string[];
          const tags = JSON.parse(e.tags) as string[];
          const parceiros = listaSegura(e.parceiros);
          const hist = hists.get(e.slug) ?? { total: 0, aprovados: 0, itens: [] };
          const aprovados = hist.itens.filter((i) => foiAprovado(i.status)).slice(0, 12);
          const cnaePrincipal = separaCnae(e.cnae_principal ?? "");
          const ativa = (e.situacao ?? "").trim().toUpperCase() === "ATIVA";
          const ufDiverge =
            !!e.uf_ficha_tecnica && !!e.uf && e.uf_ficha_tecnica.trim() !== e.uf.trim();
          const observacao = e.observacao_endereco ? semEmoji(e.observacao_endereco) : null;
          const obsPartes = observacao ? /^([^:]{1,40}):\s*([\s\S]*)$/.exec(observacao) : null;

          return (
            <section
              key={e.slug}
              id={e.slug}
              className={`scroll-mt-6 ${idx > 0 ? "pt-12 border-t border-border" : ""}`}
            >
              {/* cabeçalho da empresa */}
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mb-5">
                <div className="min-w-0">
                  <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
                    {e.apelido}
                  </h2>
                  <p className="mt-0.5 text-[0.8125rem] text-muted">
                    {e.razao_social}
                    {e.nome_fantasia ? ` · ${e.nome_fantasia}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-muted">
                  {e.situacao && (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-ink-2">
                        <span
                          className="dot"
                          style={{ background: ativa ? "var(--color-ok)" : "var(--color-warn)" }}
                          aria-hidden
                        />
                        {capitalizar(e.situacao)}
                      </span>
                      <span aria-hidden className="text-border-strong">·</span>
                    </>
                  )}
                  <span className="font-mono num text-ink-2">{e.cnpj}</span>
                  <span aria-hidden className="text-border-strong">·</span>
                  <span>
                    {e.municipio}, {e.uf}
                  </span>
                  {e.porte && (
                    <>
                      <span aria-hidden className="text-border-strong">·</span>
                      <span>Porte {e.porte}</span>
                    </>
                  )}
                </div>
              </div>

              {observacao && (
                <div className="mb-6 flex items-start gap-3 rounded-[10px] border border-border bg-warn-soft px-4 py-3.5">
                  <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-warn" aria-hidden />
                  <p className="text-sm text-ink leading-relaxed max-w-[80ch]">
                    {obsPartes ? (
                      <>
                        <span className="font-semibold">{obsPartes[1]}:</span> {obsPartes[2]}
                      </>
                    ) : (
                      observacao
                    )}
                  </p>
                </div>
              )}

              <div className="grid gap-8 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                {/* ficha cadastral */}
                <div className="card self-start">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 border-b border-border">
                    <h3 className="eyebrow">Ficha cadastral</h3>
                    <span className="text-xs text-faint">Um clique seleciona o valor</span>
                  </div>
                  <dl className="divide-y divide-border">
                    <Campo label="Razão social">
                      <span className="select-all">{e.razao_social}</span>
                    </Campo>
                    <Campo label="Nome fantasia">
                      <span className="select-all">{e.nome_fantasia || "—"}</span>
                    </Campo>
                    <Campo label="CNPJ">
                      <span className="font-mono num select-all">{e.cnpj}</span>
                    </Campo>
                    <Campo label="Data de abertura">
                      <span className="num select-all">{dataBR(e.data_abertura)}</span>
                    </Campo>
                    <Campo label="Porte">{e.porte || "—"}</Campo>
                    <Campo label="Situação cadastral">
                      {e.situacao ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="dot"
                            style={{ background: ativa ? "var(--color-ok)" : "var(--color-warn)" }}
                            aria-hidden
                          />
                          {e.situacao}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Campo>
                    <Campo label="Município e UF">
                      <span className="select-all">
                        {e.municipio}, {e.uf}
                      </span>
                      {ufDiverge && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-warn">
                          <TriangleAlert className="w-3.5 h-3.5" aria-hidden />
                          Ficha técnica indica {e.uf_ficha_tecnica}
                        </span>
                      )}
                    </Campo>
                    {e.representante_legal && (
                      <Campo label="Representante legal">
                        <span className="select-all">{e.representante_legal}</span>
                      </Campo>
                    )}
                    <Campo label="CNAE principal">
                      <div className="flex gap-3">
                        {cnaePrincipal.codigo && (
                          <span className="w-[6.75rem] shrink-0 font-mono num text-[0.8125rem] select-all">
                            {cnaePrincipal.codigo}
                          </span>
                        )}
                        <span className="text-ink-2">{cnaePrincipal.descricao || "—"}</span>
                      </div>
                    </Campo>
                    <Campo
                      label={
                        <>
                          CNAEs secundários <span className="num text-faint">{cnaes.length}</span>
                        </>
                      }
                    >
                      {cnaes.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="space-y-1.5">
                          {cnaes.map((c, i) => {
                            const s = separaCnae(c);
                            return (
                              <li key={i} className="flex gap-3">
                                {s.codigo && (
                                  <span className="w-[6.75rem] shrink-0 font-mono num text-[0.8125rem] text-ink select-all">
                                    {s.codigo}
                                  </span>
                                )}
                                <span className="text-ink-2">{s.descricao}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </Campo>
                  </dl>
                </div>

                {/* perfil para editais */}
                <div className="space-y-7 min-w-0">
                  <Bloco titulo="Apresentação">
                    <p className="text-sm text-ink-2 leading-relaxed max-w-[68ch]">
                      {e.apresentacao}
                    </p>
                  </Bloco>

                  <Bloco titulo="Métricas para editais">
                    <ul className="space-y-1.5 text-sm text-ink-2">
                      {metricas.map((m, i) => (
                        <li key={i} className="flex gap-2.5 max-w-[68ch]">
                          <Marcador />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </Bloco>

                  <Bloco titulo="Portfólio">
                    <ul className="space-y-2 text-sm">
                      {portfolio.slice(0, 4).map((p, i) => {
                        const item = separaItem(p);
                        return (
                          <li key={i} className="flex gap-2.5 max-w-[68ch]">
                            <Marcador />
                            <span className="min-w-0">
                              <span className="block font-medium text-ink">{item.nome}</span>
                              {item.detalhe && (
                                <span className="block mt-0.5 text-[0.8125rem] text-muted leading-relaxed">
                                  {item.detalhe}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Bloco>

                  {(clientes.length > 0 || parceiros.length > 0) && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {clientes.length > 0 && (
                        <Bloco titulo="Clientes">
                          <p className="text-sm text-ink-2 leading-relaxed">
                            {clientes.join(", ")}
                          </p>
                        </Bloco>
                      )}
                      {parceiros.length > 0 && (
                        <Bloco titulo="Parceiros">
                          <p className="text-sm text-ink-2 leading-relaxed">
                            {parceiros.join(", ")}
                          </p>
                        </Bloco>
                      )}
                    </div>
                  )}

                  {tags.length > 0 && (
                    <Bloco titulo="Tags de match">
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span key={t} className="tag font-mono text-[0.6875rem]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </Bloco>
                  )}
                </div>
              </div>

              {hist.total > 0 && (
                <div className="mt-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
                    <h3 className="text-sm font-semibold text-ink">Track record no Coda</h3>
                    <span className="text-[0.8125rem] text-muted num">
                      {plural(hist.aprovados, "aprovada", "aprovadas")} de{" "}
                      {plural(hist.total, "candidatura", "candidaturas")}
                    </span>
                  </div>
                  {aprovados.length > 0 ? (
                    <div className="card overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Patrocinador</th>
                            <th>Evento</th>
                            <th className="text-right">Ano</th>
                            <th className="text-right">Valor aprovado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aprovados.map((i, k) => (
                            <tr key={k}>
                              <td className="text-ink font-medium whitespace-nowrap">
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className="dot"
                                    style={{ background: "var(--color-ok)" }}
                                    aria-hidden
                                  />
                                  {i.patrocinador || "—"}
                                </span>
                              </td>
                              <td className="text-ink-2">{i.evento || "—"}</td>
                              <td className="text-right num text-ink-2">{i.ano || "—"}</td>
                              <td className="text-right num text-ink-2 whitespace-nowrap">
                                {i.valorAprovado || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      Nenhuma aprovação registrada entre as candidaturas importadas.
                    </p>
                  )}
                  {hist.aprovados > aprovados.length && (
                    <p className="mt-2 text-xs text-faint num">
                      Mostrando {aprovados.length} de {hist.aprovados} aprovações.
                    </p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
