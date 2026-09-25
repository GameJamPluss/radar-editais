"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

type Resultado = {
  tom: "ok" | "aviso" | "erro";
  texto: string;
  detalhe?: string;
};

const TOM: Record<Resultado["tom"], { icon: LucideIcon; cor: string }> = {
  ok: { icon: CircleCheck, cor: "text-ok" },
  aviso: { icon: TriangleAlert, cor: "text-warn" },
  erro: { icon: CircleAlert, cor: "text-danger" },
};

function plural(n: number, um: string, varios: string) {
  return n === 1 ? `1 ${um}` : `${n ?? 0} ${varios}`;
}

export function ScanButton() {
  const [rodando, setRodando] = useState(false);
  const [msg, setMsg] = useState<Resultado | null>(null);
  const router = useRouter();

  async function varrer() {
    setRodando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "o servidor não retornou detalhes");
      const erros: string[] = data.erros ?? [];
      setMsg({
        tom: erros.length ? "aviso" : "ok",
        texto: `${plural(data.novos, "novo", "novos")} de ${plural(
          data.totalEncontrados,
          "encontrado",
          "encontrados"
        )}${erros.length ? ` · ${plural(erros.length, "erro", "erros")}` : ""}`,
        detalhe: erros.length ? erros.join("\n") : undefined,
      });
      router.refresh();
    } catch (err) {
      setMsg({
        tom: "erro",
        texto: `Falha na varredura: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setRodando(false);
    }
  }

  const tom = msg ? TOM[msg.tom] : null;
  const TomIcon = tom?.icon;

  return (
    <div className="flex flex-row-reverse items-center gap-3">
      <button
        className="btn btn-primary"
        onClick={varrer}
        disabled={rodando}
        aria-busy={rodando}
      >
        {rodando ? (
          <>
            <LoaderCircle className="spin" aria-hidden />
            Varrendo fontes…
          </>
        ) : (
          <>
            <RefreshCw aria-hidden />
            Varrer agora
          </>
        )}
      </button>
      <p
        role="status"
        aria-live="polite"
        className="max-w-[36ch] text-[0.8125rem] leading-snug text-muted text-right"
      >
        {rodando ? (
          "Pode levar alguns minutos."
        ) : msg && tom && TomIcon ? (
          <span className="inline-flex items-start gap-1.5" title={msg.detalhe}>
            <TomIcon className={`w-3.5 h-3.5 mt-px shrink-0 ${tom.cor}`} aria-hidden />
            <span className="num text-ink-2">{msg.texto}</span>
          </span>
        ) : null}
      </p>
    </div>
  );
}
