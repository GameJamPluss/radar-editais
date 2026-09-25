import Link from "next/link";
import { Building, Info, Layers, type LucideIcon } from "lucide-react";
import { all } from "@/lib/db";
import { PILAR_META, EMPRESA_META, EmptyState, PageHeader, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const CATEGORIA_LABEL: Record<string, string> = {
  apresentacao: "Apresentação",
  metricas: "Métricas",
  cases: "Cases",
  argumentacao: "Argumentação",
};

const ORIGEM_LABEL: Record<string, string> = {
  seed: "Base inicial",
  "projetos-locais": "Projetos catalogados",
};

// Títulos vindos do banco usam travessão como separador; na tela vira "·".
function tituloLimpo(t: string): string {
  return t.replace(/\s+[\u2013\u2014]\s+/g, " · ");
}

type Texto = {
  id: number;
  titulo: string;
  pilar_slug: string | null;
  empresa_slug: string | null;
  categoria: string;
  conteudo: string;
  origem: string;
};

export default async function BancoTextosPage() {
  const textos = await all<{
    id: number;
    titulo: string;
    pilar_slug: string | null;
    empresa_slug: string | null;
    categoria: string;
    conteudo: string;
    origem: string;
  }>("SELECT * FROM banco_textos ORDER BY pilar_slug, categoria");

  const pilares = await all<{
    slug: string;
    nome: string;
    emoji: string;
    descricao: string;
    empresa_slug: string | null;
  }>("SELECT slug, nome, emoji, descricao, empresa_slug FROM pilares");

  // Agrupa os textos por pilar, na ordem dos pilares; o que sobrar
  // (pilar desconhecido ou sem pilar) entra no fim, na ordem da consulta.
  const porPilar = new Map<string, Texto[]>();
  for (const t of textos) {
    const chave = t.pilar_slug ?? "";
    const lista = porPilar.get(chave) ?? [];
    lista.push(t);
    porPilar.set(chave, lista);
  }
  const ordem = [
    ...pilares.map((p) => p.slug).filter((s) => porPilar.has(s)),
    ...[...porPilar.keys()].filter((s) => !pilares.some((p) => p.slug === s)),
  ];
  const grupos = ordem.map((slug) => {
    const pilar = pilares.find((p) => p.slug === slug);
    const nome = pilar?.nome ?? (slug ? PILAR_META[slug]?.label ?? slug : "Sem pilar");
    const icon: LucideIcon = (slug && PILAR_META[slug]?.icon) || Layers;
    return { slug, nome, icon, textos: porPilar.get(slug) ?? [] };
  });

  return (
    <div>
      <PageHeader
        title="Banco de textos"
        description="Matéria-prima das propostas: textos oficiais, métricas e cases por pilar. A IA usa exatamente estes textos na escrita, sem inventar números."
      />

      <div className="space-y-10">
        <section>
          <SectionHeader title="Pilares" count={pilares.length} />
          <div className="card overflow-hidden">
            <div className="hidden xl:grid grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)_minmax(10rem,12rem)_3.5rem] gap-x-6 px-5 py-2.5 border-b border-border bg-surface-2">
              <span className="eyebrow">Pilar</span>
              <span className="eyebrow">Escopo</span>
              <span className="eyebrow">Executora</span>
              <span className="eyebrow text-right">Textos</span>
            </div>
            <ul className="divide-y divide-border">
              {pilares.map((p) => {
                const Icon = PILAR_META[p.slug]?.icon ?? Layers;
                const n = porPilar.get(p.slug)?.length ?? 0;
                return (
                  <li key={p.slug}>
                    <a
                      href={n > 0 ? `#pilar-${p.slug}` : undefined}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 px-5 py-3.5 text-sm xl:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)_minmax(10rem,12rem)_3.5rem] xl:items-baseline transition-colors ${
                        n > 0 ? "hover:bg-surface-2" : ""
                      }`}
                    >
                      <span className="order-1 flex items-center gap-2 font-medium text-ink">
                        <Icon className="w-4 h-4 text-faint shrink-0 self-center" aria-hidden />
                        {p.nome}
                      </span>
                      <span className="order-2 xl:order-4 text-[0.8125rem] text-ink-2 num text-right">
                        {n}
                        <span className="xl:hidden text-muted"> {n === 1 ? "texto" : "textos"}</span>
                      </span>
                      <span className="order-3 xl:order-2 col-span-2 xl:col-span-1 text-[0.8125rem] text-muted leading-relaxed max-w-[70ch]">
                        {p.descricao}
                      </span>
                      <span
                        className={`order-4 xl:order-3 col-span-2 xl:col-span-1 text-[0.8125rem] text-ink-2 ${
                          p.empresa_slug ? "" : "hidden xl:block"
                        }`}
                      >
                        {p.empresa_slug ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-faint" aria-hidden />
                            {EMPRESA_META[p.empresa_slug] ?? p.empresa_slug}
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {grupos.length === 0 ? (
          <EmptyState
            title="Nenhum texto cadastrado"
            description="Sincronize o banco de textos na tela de configurações para carregar os projetos catalogados."
            action={
              <Link href="/config" className="btn btn-secondary btn-sm">
                Abrir configurações
              </Link>
            }
          />
        ) : (
          grupos.map((g) => {
            const Icon = g.icon;
            return (
              <section key={g.slug || "sem-pilar"} id={`pilar-${g.slug || "sem-pilar"}`} className="scroll-mt-6">
                <SectionHeader
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Icon className="w-4 h-4 text-faint" aria-hidden />
                      {g.nome}
                    </span>
                  }
                  count={g.textos.length}
                />
                <div className="card divide-y divide-border">
                  {g.textos.map((t) => {
                    const empresa = t.empresa_slug
                      ? EMPRESA_META[t.empresa_slug] ?? t.empresa_slug
                      : null;
                    return (
                      <article
                        key={t.id}
                        className="grid gap-x-8 gap-y-3 px-5 py-5 lg:grid-cols-[12rem_minmax(0,1fr)]"
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 lg:flex-col lg:items-start text-[0.8125rem]">
                          <span className="tag">{CATEGORIA_LABEL[t.categoria] ?? t.categoria}</span>
                          {empresa && (
                            <span className="inline-flex items-center gap-1.5 text-ink-2">
                              <Building className="w-3.5 h-3.5 text-faint" aria-hidden />
                              {empresa}
                            </span>
                          )}
                          <span className="text-xs text-faint">
                            Origem: {ORIGEM_LABEL[t.origem] ?? t.origem}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-ink leading-snug">{tituloLimpo(t.titulo)}</h3>
                          <p className="mt-2 text-sm text-ink-2 leading-relaxed max-w-[72ch] whitespace-pre-line">
                            {t.conteudo}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        <aside className="flex items-start gap-3 rounded-[10px] border border-border bg-surface-2 px-4 py-3.5 text-sm text-muted">
          <Info className="w-4 h-4 mt-0.5 text-faint shrink-0" aria-hidden />
          <p className="max-w-[72ch] leading-relaxed">
            <span className="font-medium text-ink-2">Próximo passo:</span> sincronizar com o
            Banco de referências do Coda. A integração já tem espaço reservado, falta só
            configurar um token de API do Coda.
          </p>
        </aside>
      </div>
    </div>
  );
}
