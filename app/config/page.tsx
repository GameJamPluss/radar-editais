"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/ui";

interface FonteRss {
  id?: number;
  nome: string;
  url: string;
  ativa: number | boolean;
}

interface Settings {
  keywords: string[];
  cronSemanal: string | null;
  prazoMinimoDias: number;
  fontesRss: FonteRss[];
  telegramAtivo: boolean;
  telegramChats: number;
  claudeAtivo: boolean;
  modoIa: "auto" | "assinatura" | "api" | "heuristica";
  modoIaResolvido: "assinatura" | "api" | "heuristica";
  modoIaRotulo: string;
  cliDisponivel: boolean;
  cliVersao: string | null;
  apiDisponivel: boolean;
  iaMaxPorVarredura: number;
}

/** Mensagem de resultado exibida ao lado de uma ação. */
interface Aviso {
  tipo: "ok" | "erro" | "alerta" | "info" | "progresso";
  texto: string;
}

function erroTexto(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/* ------------------------------------------------------------------
   Peças de layout locais
   ------------------------------------------------------------------ */

function AvisoInline({ aviso }: { aviso: Aviso }) {
  const Icon =
    aviso.tipo === "ok"
      ? CircleCheck
      : aviso.tipo === "erro"
        ? CircleAlert
        : aviso.tipo === "alerta"
          ? TriangleAlert
          : aviso.tipo === "progresso"
            ? LoaderCircle
            : Info;
  const corIcone =
    aviso.tipo === "ok"
      ? "text-ok"
      : aviso.tipo === "erro"
        ? "text-danger"
        : aviso.tipo === "alerta"
          ? "text-warn"
          : aviso.tipo === "progresso"
            ? "text-accent spin"
            : "text-faint";
  return (
    <p
      role="status"
      className={`flex items-start gap-1.5 text-[0.8125rem] leading-snug ${
        aviso.tipo === "erro" ? "text-danger" : "text-ink-2"
      }`}
    >
      <Icon className={`mt-px h-3.5 w-3.5 shrink-0 ${corIcone}`} aria-hidden />
      <span>{aviso.texto}</span>
    </p>
  );
}

/** Linha de configuração: título e explicação à esquerda, controles à direita. */
function Linha({
  titulo,
  descricao,
  htmlFor,
  meta,
  children,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  htmlFor?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const tituloClasse = "block text-sm font-semibold text-ink";
  return (
    <div className="grid gap-x-10 gap-y-4 px-6 py-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={tituloClasse}>
            {titulo}
          </label>
        ) : (
          <h3 className={tituloClasse}>{titulo}</h3>
        )}
        {descricao && (
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted max-w-[46ch]">
            {descricao}
          </p>
        )}
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface-2 px-1 py-px font-mono text-[0.75rem] text-ink-2">
      {children}
    </code>
  );
}

function Estado({ ativo, children }: { ativo: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-2">
      <span
        className="dot"
        style={{ background: ativo ? "var(--color-ok)" : "var(--color-border-strong)" }}
        aria-hidden
      />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------
   Página
   ------------------------------------------------------------------ */

export default function ConfigPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [keywords, setKeywords] = useState("");
  const [cron, setCron] = useState("");
  const [fontes, setFontes] = useState<FonteRss[]>([]);
  const [msg, setMsg] = useState<Aviso | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [codaMsg, setCodaMsg] = useState<Aviso | null>(null);
  const [codaSync, setCodaSync] = useState(false);
  const [projMsg, setProjMsg] = useState<Aviso | null>(null);
  const [projSync, setProjSync] = useState(false);
  const [modoIa, setModoIa] = useState<Settings["modoIa"]>("auto");
  const [iaMax, setIaMax] = useState(10);
  const [reMsg, setReMsg] = useState<Aviso | null>(null);
  const [reRodando, setReRodando] = useState(false);

  interface BatchStatus {
    rodando: boolean;
    total: number;
    feitos: number;
    erros: number;
    ultimoEdital: string | null;
    finalizadoEm: string | null;
  }
  const [batch, setBatch] = useState<BatchStatus | null>(null);
  const [batchMsg, setBatchMsg] = useState<Aviso | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setS(data);
        setKeywords(data.keywords.join(", "));
        setCron(data.cronSemanal ?? "0 9 * * 1");
        setFontes(data.fontesRss);
        setModoIa(data.modoIa ?? "auto");
        setIaMax(data.iaMaxPorVarredura ?? 10);
      });
    // carrega o status inicial do lote
    fetch("/api/reanalyze/batch")
      .then((r) => r.json())
      .then(setBatch)
      .catch(() => {});
  }, []);

  // enquanto o lote roda, pega o progresso a cada 3s
  useEffect(() => {
    if (!batch?.rodando) return;
    const t = setInterval(() => {
      fetch("/api/reanalyze/batch")
        .then((r) => r.json())
        .then(setBatch)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [batch?.rodando]);

  async function iniciarBatch() {
    setBatchMsg(null);
    try {
      const res = await fetch("/api/reanalyze/batch", { method: "POST", body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha");
      setBatch(data.status);
    } catch (err) {
      setBatchMsg({ tipo: "erro", texto: erroTexto(err) });
    }
  }

  async function cancelarBatch() {
    await fetch("/api/reanalyze/batch", { method: "DELETE" });
    setBatchMsg({ tipo: "info", texto: "Cancelado. O que já foi analisado fica salvo." });
  }

  async function reanalisar() {
    setReRodando(true);
    setReMsg({
      tipo: "progresso",
      texto: "Reanalisando os melhores editais com IA. Pode levar alguns minutos.",
    });
    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limite: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha");
      setReMsg({
        tipo: "ok",
        texto: `${data.processados} edital(is) reanalisado(s) via ${data.modo === "assinatura" ? "assinatura" : "API"}.`,
      });
    } catch (err) {
      setReMsg({ tipo: "erro", texto: erroTexto(err) });
    } finally {
      setReRodando(false);
    }
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          cronSemanal: cron,
          fontesRss: fontes.filter((f) => f.url),
          modoIa,
          iaMaxPorVarredura: iaMax,
        }),
      });
      if (!res.ok) throw new Error("falha ao salvar");
      setMsg({ tipo: "ok", texto: "Configurações salvas." });
    } catch (err) {
      setMsg({ tipo: "erro", texto: erroTexto(err) });
    } finally {
      setSalvando(false);
    }
  }

  async function sincronizarCoda() {
    setCodaSync(true);
    setCodaMsg(null);
    try {
      const res = await fetch("/api/coda-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha");
      setCodaMsg({
        tipo: "ok",
        texto: `Importado do Coda: ${data.historico} registro(s) de histórico, ${data.editais} edital(is) ou plataforma(s).`,
      });
    } catch (err) {
      setCodaMsg({ tipo: "erro", texto: erroTexto(err) });
    } finally {
      setCodaSync(false);
    }
  }

  async function sincronizarProjetos() {
    setProjSync(true);
    setProjMsg(null);
    try {
      const res = await fetch("/api/banco-textos-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "falha");
      const partes = [
        `Banco de textos sincronizado`,
        `${data.inseridos} novo(s)`,
        `${data.atualizados} atualizado(s)`,
        `${data.ignorados} sem mudança`,
      ];
      if (data.erros?.length) partes.push(`${data.erros.length} erro(s)`);
      setProjMsg({ tipo: data.erros?.length ? "alerta" : "ok", texto: partes.join(" · ") });
    } catch (err) {
      setProjMsg({ tipo: "erro", texto: erroTexto(err) });
    } finally {
      setProjSync(false);
    }
  }

  const header = (
    <PageHeader
      title="Configurações"
      description="Como o radar busca, analisa e alerta: modo de IA, agenda, palavras-chave, fontes RSS e integrações."
    />
  );

  if (!s) {
    return (
      <div className="max-w-5xl">
        {header}
        <p className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="h-4 w-4 spin text-faint" aria-hidden />
          Carregando configurações…
        </p>
      </div>
    );
  }

  const opcoesModo: {
    valor: Settings["modoIa"];
    titulo: string;
    desc: ReactNode;
    disponivel: boolean;
    recomendado?: boolean;
  }[] = [
    {
      valor: "auto",
      titulo: "Automático",
      desc: "Tenta, nesta ordem: assinatura (se o Claude Code estiver logado), API e heurística.",
      disponivel: true,
      recomendado: true,
    },
    {
      valor: "assinatura",
      titulo: "Assinatura Claude (Pro/Max)",
      desc: s.cliDisponivel ? (
        <>
          CLI detectado ({s.cliVersao ?? "ok"}). Não usa crédito de API. A partir de 15/06/2026
          consome o crédito mensal dedicado do plano (US$ 100 a 200 no Max).
        </>
      ) : (
        <>
          Indisponível: instale e logue o Claude Code (<Code>claude</Code>) nesta máquina.
        </>
      ),
      disponivel: s.cliDisponivel,
    },
    {
      valor: "api",
      titulo: "API Anthropic",
      desc: s.apiDisponivel ? (
        "Chave configurada. Cobra créditos de API. Indicado para serverless ou produção compartilhada."
      ) : (
        <>
          Indisponível: defina <Code>ANTHROPIC_API_KEY</Code> no <Code>.env.local</Code>.
        </>
      ),
      disponivel: s.apiDisponivel,
    },
    {
      valor: "heuristica",
      titulo: "Heurística local",
      desc: "Triagem por palavras-chave e regras. Grátis, sempre disponível, menos precisa.",
      disponivel: true,
    },
  ];

  const totalKeywords = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean).length;

  const pct = batch?.total ? Math.round((batch.feitos / batch.total) * 100) : 0;

  return (
    <div className="max-w-5xl">
      {header}

      <div className="space-y-10">
        {/* ---------- configurações salvas pelo botão ---------- */}
        <section>
          <SectionHeader title="Varredura e análise" />
          <div className="card divide-y divide-border">
            <Linha
              titulo="Modo de IA"
              descricao="Como o app analisa editais e escreve propostas."
              meta={
                <span className="inline-flex items-center gap-2 text-[0.8125rem] text-muted">
                  <span className="dot" style={{ background: "var(--color-ok)" }} aria-hidden />
                  Em uso agora:
                  <span className="font-medium text-ink">{s.modoIaRotulo}</span>
                </span>
              }
            >
              <div
                role="radiogroup"
                aria-label="Modo de IA"
                className="overflow-hidden rounded-[7px] border border-border divide-y divide-border"
              >
                {opcoesModo.map((op) => {
                  const ativo = modoIa === op.valor;
                  return (
                    <label
                      key={op.valor}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${
                        ativo ? "bg-accent-soft" : "hover:bg-surface-2"
                      } ${op.disponivel ? "" : "opacity-60"}`}
                    >
                      <input
                        type="radio"
                        name="modoIa"
                        value={op.valor}
                        checked={ativo}
                        onChange={() => setModoIa(op.valor)}
                        className="mt-[3px] accent-accent"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink">{op.titulo}</span>
                          {op.recomendado && <span className="tag">Recomendado</span>}
                          {!op.disponivel && (
                            <span className="text-xs text-muted">Indisponível</span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted">
                          {op.desc}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </Linha>

            <Linha
              titulo="Análises com IA por varredura"
              htmlFor="ia-max"
              descricao="A heurística faz a triagem de todos os editais de graça. A IA aprofunda só os primeiros N."
            >
              <div className="flex items-center gap-3">
                <div className="w-24">
                  <input
                    id="ia-max"
                    type="number"
                    min={0}
                    max={100}
                    value={iaMax}
                    onChange={(e) => setIaMax(parseInt(e.target.value, 10) || 0)}
                    className="input num"
                  />
                </div>
                <span className="text-[0.8125rem] text-muted">no máximo, de 0 a 100</span>
              </div>
            </Linha>

            <Linha
              titulo="Agenda da varredura"
              htmlFor="cron"
              descricao={
                <>
                  Expressão cron. Padrão <Code>0 9 * * 1</Code>, toda segunda às 9h. Os alertas vão
                  para os chats do Telegram registrados via <Code>/start</Code>.
                </>
              }
            >
              <div className="max-w-[16rem]">
                <input
                  id="cron"
                  value={cron}
                  onChange={(e) => setCron(e.target.value)}
                  className="input font-mono"
                  spellCheck={false}
                />
              </div>
            </Linha>

            <Linha
              titulo="Palavras-chave da busca ativa"
              htmlFor="keywords"
              descricao="Cada palavra-chave vira uma busca na Central de Editais da Prosas."
            >
              <textarea
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={3}
                className="textarea leading-relaxed"
              />
              <p className="mt-2 text-xs text-muted">
                Separe por vírgula · <span className="num">{totalKeywords}</span>{" "}
                {totalKeywords === 1 ? "palavra-chave" : "palavras-chave"}
              </p>
            </Linha>

            <Linha
              titulo="Fontes RSS adicionais"
              descricao="Qualquer feed RSS ou Atom de editais entra na varredura: newsletters, diários oficiais com feed, blogs de fomento."
            >
              {fontes.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[11rem_minmax(0,1fr)_2.75rem] gap-2">
                    <span className="eyebrow">Nome</span>
                    <span className="eyebrow">URL do feed</span>
                    <span />
                  </div>
                  {fontes.map((f, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[11rem_minmax(0,1fr)_2.75rem] items-center gap-2"
                    >
                      <input
                        placeholder="nome"
                        aria-label={`Nome da fonte ${i + 1}`}
                        value={f.nome}
                        onChange={(e) =>
                          setFontes(
                            fontes.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x))
                          )
                        }
                        className="input"
                      />
                      <input
                        placeholder="https://exemplo.com/feed"
                        aria-label={`URL da fonte ${i + 1}`}
                        value={f.url}
                        onChange={(e) =>
                          setFontes(
                            fontes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x))
                          )
                        }
                        className="input font-mono"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        className="btn btn-quiet"
                        aria-label={`Remover fonte ${f.nome || i + 1}`}
                        title="Remover fonte"
                        onClick={() => setFontes(fontes.filter((_, j) => j !== i))}
                      >
                        <X aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Nenhuma fonte adicional cadastrada.</p>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-3"
                onClick={() => setFontes([...fontes, { nome: "", url: "", ativa: 1 }])}
              >
                <Plus aria-hidden />
                Adicionar fonte
              </button>
            </Linha>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-b-[9px] bg-surface-2 px-6 py-3.5">
              <p className="text-[0.8125rem] text-muted">
                Modo de IA, limite, agenda, palavras-chave e fontes RSS são salvos juntos.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {msg && <AvisoInline aviso={msg} />}
                <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
                  {salvando ? (
                    <LoaderCircle className="spin" aria-hidden />
                  ) : (
                    <Save aria-hidden />
                  )}
                  {salvando ? "Salvando…" : "Salvar configurações"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- ações imediatas de reanálise ---------- */}
        <section>
          <SectionHeader title="Reanálise com IA" />
          <div className="card divide-y divide-border">
            <Linha
              titulo="Melhores editais"
              descricao="Reanalisa com IA os 10 editais de maior score. Pode levar alguns minutos."
            >
              <div className="space-y-3">
                <button className="btn btn-secondary" onClick={reanalisar} disabled={reRodando}>
                  {reRodando ? (
                    <LoaderCircle className="spin" aria-hidden />
                  ) : (
                    <Sparkles aria-hidden />
                  )}
                  {reRodando ? "Reanalisando…" : "Reanalisar top 10 com IA"}
                </button>
                {reMsg && <AvisoInline aviso={reMsg} />}
              </div>
            </Linha>

            <Linha
              titulo="Pipeline inteiro"
              descricao="Substitui a triagem heurística, que superestima, pela análise do Claude em todos os editais com prazo aberto. O topo passa a refletir a elegibilidade real. Roda em segundo plano: pode fechar a página."
            >
              <div className="space-y-4">
                {batch?.rodando ? (
                  <button className="btn btn-secondary" onClick={cancelarBatch}>
                    <CircleX aria-hidden />
                    Cancelar
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={iniciarBatch}>
                    <Layers aria-hidden />
                    Reanalisar tudo
                  </button>
                )}

                {batch && (batch.rodando || batch.total > 0) && (
                  <div className="max-w-xl space-y-2">
                    <div className="flex items-baseline justify-between gap-4 text-[0.8125rem]">
                      <span className="inline-flex items-center gap-1.5 text-ink-2">
                        {batch.rodando ? (
                          <LoaderCircle className="h-3.5 w-3.5 spin text-accent" aria-hidden />
                        ) : (
                          <CircleCheck className="h-3.5 w-3.5 text-ok" aria-hidden />
                        )}
                        {batch.rodando ? "Analisando" : "Concluído"}
                      </span>
                      <span className="num text-muted">
                        {batch.feitos}/{batch.total}
                        {batch.erros > 0 && (
                          <span className="text-danger"> · {batch.erros} erro(s)</span>
                        )}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-border"
                      role="progressbar"
                      aria-label="Progresso da reanálise"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {batch.ultimoEdital && (
                      <p className="truncate text-xs text-muted" title={batch.ultimoEdital}>
                        <span className="text-faint">Último: </span>
                        {batch.ultimoEdital}
                      </p>
                    )}
                  </div>
                )}
                {batchMsg && <AvisoInline aviso={batchMsg} />}
              </div>
            </Linha>
          </div>
        </section>

        {/* ---------- integrações ---------- */}
        <section>
          <SectionHeader title="Integrações" />
          <div className="card divide-y divide-border">
            <Linha titulo="Telegram" descricao="Alertas do monitoramento semanal.">
              {s.telegramAtivo ? (
                <Estado ativo>
                  Bot ativo · <span className="num">{s.telegramChats}</span> chat(s) registrados
                  para alertas
                </Estado>
              ) : (
                <div className="space-y-1.5">
                  <Estado ativo={false}>Não configurado</Estado>
                  <p className="text-[0.8125rem] text-muted">
                    Defina <Code>TELEGRAM_BOT_TOKEN</Code> no <Code>.env.local</Code>. Crie o bot
                    com o @BotFather.
                  </p>
                </div>
              )}
            </Linha>

            <Linha
              titulo="Coda"
              descricao={
                <>
                  Snapshot do doc <span className="text-ink-2">GJ+ Editais</span> já exportado: banco
                  de referências, histórico de submissões 2025/2026 e plataformas de patrocínio.
                </>
              }
            >
              <div className="space-y-3">
                <Estado ativo>Snapshot exportado</Estado>
                <div>
                  <button
                    className="btn btn-secondary"
                    onClick={sincronizarCoda}
                    disabled={codaSync}
                  >
                    <RefreshCw className={codaSync ? "spin" : undefined} aria-hidden />
                    {codaSync ? "Importando…" : "Sincronizar Coda"}
                  </button>
                  <p className="mt-2 text-xs text-muted">Importa ou atualiza os dados do snapshot.</p>
                </div>
                {codaMsg && <AvisoInline aviso={codaMsg} />}
              </div>
            </Linha>

            <Linha
              titulo="Banco de textos"
              descricao="Catálogo dos projetos submetidos por Startup GRID (GJ+), Acelera Indie e Plug and Plus, com escopo, orçamento, patrocinador e temas. A IA usa esse catálogo para ganhar precisão na escrita de propostas e no match de editais."
            >
              <div className="space-y-3">
                <button
                  className="btn btn-secondary"
                  onClick={sincronizarProjetos}
                  disabled={projSync}
                >
                  <RefreshCw className={projSync ? "spin" : undefined} aria-hidden />
                  {projSync ? "Importando…" : "Sincronizar banco de textos"}
                </button>
                {projMsg && <AvisoInline aviso={projMsg} />}
              </div>
            </Linha>
          </div>
        </section>
      </div>
    </div>
  );
}
