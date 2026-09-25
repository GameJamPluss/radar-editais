import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Earth,
  GraduationCap,
  Handshake,
  Landmark,
  Lightbulb,
  Link2,
  PenLine,
  Rss,
  Satellite,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { fonteDeEdital } from "@/lib/fontes-catalogo";

/* ------------------------------------------------------------------
   Metadados de domínio
   ------------------------------------------------------------------ */

// `dot` é a cor do ponto de status (variável do tema em app/globals.css).
export const STATUS_META: Record<string, { label: string; dot: string }> = {
  radar: { label: "Radar", dot: "var(--color-faint)" },
  triagem: { label: "Triagem", dot: "var(--color-warn)" },
  match: { label: "Match", dot: "var(--color-info)" },
  "com-dependencia": { label: "Com dependência", dot: "var(--color-orange)" },
  escrita: { label: "Escrita", dot: "var(--color-accent)" },
  submetido: { label: "Submetido", dot: "var(--color-ok)" },
  descartado: { label: "Descartado", dot: "var(--color-border-strong)" },
};

export const PILAR_META: Record<string, { label: string; icon: LucideIcon }> = {
  educacao: { label: "Educação", icon: GraduationCap },
  internacionalizacao: { label: "Internacionalização", icon: Earth },
  inovacao: { label: "Inovação", icon: Lightbulb },
  eventos: { label: "Eventos", icon: CalendarDays },
};

export const EMPRESA_META: Record<string, string> = {
  "startup-grid": "GameJam+ (Startup Grid)",
  "acelera-indie": "Indie Hero",
  "plug-and-plus": "Plug and Plus",
};

// Ícone por nível do catálogo de fontes (lib/fontes-catalogo.ts).
export const NIVEL_ICON: Record<number, LucideIcon> = {
  1: Satellite,
  2: Earth,
  3: Landmark,
  4: Handshake,
  5: Rss,
  6: Link2,
};

// Ícone pela origem do edital (campo `editais.fonte`).
export function fonteIcon(slug: string): LucideIcon {
  if (slug === "prosas") return Satellite;
  if (slug === "rss") return Rss;
  if (slug === "ia") return Sparkles;
  return PenLine;
}

/* ------------------------------------------------------------------
   Formatação
   ------------------------------------------------------------------ */

// Os prazos chegam em dois formatos: só a data ("2026-09-30") ou data e hora
// com fuso ("2026-09-30T18:00:00-03:00"). "Só a data" não pode virar
// meia-noite UTC, senão no Brasil ele aparece um dia antes e encerra no
// próprio último dia. Todo cálculo usa o calendário de São Paulo.
const TZ = "America/Sao_Paulo";
const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const diaSP = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

function lerData(iso: string): { d: Date; soData: boolean } | null {
  const soData = SO_DATA.test(iso);
  const d = new Date(soData ? `${iso}T12:00:00-03:00` : iso);
  return isNaN(d.getTime()) ? null : { d, soData };
}

export function fmtData(iso: string | null): string {
  if (!iso) return "—";
  const lida = lerData(iso);
  if (!lida) return iso;
  return lida.d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ })
    .replace(/\./g, "");
}

export function diasRestantes(iso: string | null): number | null {
  if (!iso) return null;
  const lida = lerData(iso);
  if (!lida) return null;
  // prazo com hora que já passou hoje conta como encerrado
  if (!lida.soData && lida.d.getTime() < Date.now()) return -1;
  const [a, b] = [diaSP.format(lida.d), diaSP.format(new Date())].map((s) => {
    const [y, m, dd] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, dd);
  });
  return Math.round((a - b) / 86_400_000);
}

/* ------------------------------------------------------------------
   Primitivos de página
   ------------------------------------------------------------------ */

/** Cabeçalho padrão de toda página: título, descrição curta e ações. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-6 mb-8 border-b border-border">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[0.9375rem] text-muted leading-relaxed max-w-[65ch]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Cabeçalho de seção dentro da página, com link opcional à direita. */
export function SectionHeader({
  title,
  href,
  linkLabel,
  count,
}: {
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  count?: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-3">
      <h2 className="text-[0.9375rem] font-semibold text-ink">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 text-muted font-normal num">{count}</span>
        )}
      </h2>
      {href && (
        <Link href={href} className="link-quiet">
          {linkLabel ?? "Ver todos"}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Indicador numérico (KPI). */
export function Stat({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="card px-5 py-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.02em] num text-ink">
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </div>
  );
}

/** Estado vazio: frase direta + ação opcional. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card px-6 py-8 text-center">
      <div className="text-sm font-medium text-ink">{title}</div>
      {description && (
        <div className="mt-1 text-sm text-muted max-w-[48ch] mx-auto">{description}</div>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------
   Componentes de domínio
   ------------------------------------------------------------------ */

export function StatusDot({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.radar;
  return <span className="dot" style={{ background: meta.dot }} aria-hidden />;
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.radar;
  return (
    <span className="tag">
      <span className="dot" style={{ background: meta.dot }} aria-hidden />
      {meta.label}
    </span>
  );
}

export function PilarLabel({ slug }: { slug: string | null }) {
  const pilar = slug ? PILAR_META[slug] : null;
  if (!pilar) return null;
  const Icon = pilar.icon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-faint" aria-hidden />
      {pilar.label}
    </span>
  );
}

function scoreColor(s: number): string {
  if (s >= 60) return "var(--color-ok)";
  if (s >= 30) return "var(--color-warn)";
  return "var(--color-faint)";
}

export function ScoreRing({ score }: { score: number | null }) {
  const s = score ?? 0;
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative w-11 h-11 shrink-0"
      title={score === null ? "Sem score" : `Score ${s} de 100`}
    >
      <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-border)" strokeWidth="3" />
        {score !== null && (
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke={scoreColor(s)}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(s / 100) * c} ${c}`}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[0.8125rem] font-semibold num text-ink">
        {score ?? "—"}
      </span>
    </div>
  );
}

export function PrazoChip({ fim }: { fim: string | null }) {
  const dias = diasRestantes(fim);
  if (dias === null) return <span className="text-xs text-muted">Sem prazo</span>;
  if (dias < 0) return <span className="text-xs text-faint">Encerrado</span>;
  const cor = dias <= 5 ? "text-danger" : dias <= 12 ? "text-warn" : "text-ink-2";
  return (
    <span className={`text-xs font-medium num ${cor}`}>
      {dias === 0 ? "Último dia" : dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`}
    </span>
  );
}

export function EditalCard({
  e,
}: {
  e: {
    id: number;
    nome: string;
    orgao: string | null;
    score: number | null;
    status: string;
    fim_inscricoes: string | null;
    pilar_slug: string | null;
    empresa_slug: string | null;
    fonte?: string | null;
  };
}) {
  const fonte = fonteDeEdital(e.fonte ?? null);
  const FonteIcon = fonteIcon(fonte.slug);
  return (
    <Link href={`/editais/${e.id}`} className="card px-4 py-3.5 flex items-center gap-4">
      <ScoreRing score={e.score} />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-ink truncate">{e.nome}</div>
        <div className="mt-0.5 text-[0.8125rem] text-muted truncate flex items-center gap-x-2">
          <span className="truncate">{e.orgao ?? "Órgão não informado"}</span>
          {e.pilar_slug && PILAR_META[e.pilar_slug] && (
            <>
              <span aria-hidden className="text-border-strong">·</span>
              <PilarLabel slug={e.pilar_slug} />
            </>
          )}
          {e.empresa_slug && (
            <>
              <span aria-hidden className="text-border-strong">·</span>
              <span className="truncate">{EMPRESA_META[e.empresa_slug] ?? e.empresa_slug}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusBadge status={e.status} />
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1" title="Onde foi encontrado">
            <FonteIcon className="w-3.5 h-3.5 text-faint" aria-hidden />
            {fonte.nome}
          </span>
          <span aria-hidden className="text-border-strong">·</span>
          <PrazoChip fim={e.fim_inscricoes} />
        </div>
      </div>
    </Link>
  );
}
