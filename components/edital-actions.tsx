"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleAlert, LoaderCircle, PenLine, Target } from "lucide-react";
import { STATUS_META, StatusDot } from "./ui";

export function EditalActions({
  editalId,
  status,
}: {
  editalId: number;
  status: string;
}) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function analisar() {
    setOcupado("analisar");
    setMsg(null);
    try {
      const res = await fetch(`/api/editais/${editalId}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).erro);
      router.refresh();
    } catch (err) {
      setMsg(`Não foi possível analisar: ${err instanceof Error ? err.message : err}`);
    } finally {
      setOcupado(null);
    }
  }

  async function gerarProposta() {
    setOcupado("proposta");
    setMsg("Iniciando a redação…");
    try {
      const res = await fetch(`/api/editais/${editalId}/proposta`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      // abre a proposta na hora: ela mostra "escrevendo" e atualiza sozinha
      router.push(`/propostas/${data.id}`);
    } catch (err) {
      setMsg(
        `Não foi possível gerar a proposta: ${err instanceof Error ? err.message : err}`
      );
      setOcupado(null);
    }
  }

  async function mudarStatus(novo: string) {
    setOcupado("status");
    try {
      await fetch(`/api/editais/${editalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novo }),
      });
      router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  // msg com ação em andamento = progresso; msg sem ação = erro.
  const msgEmAndamento = msg !== null && ocupado !== null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex">
          {ocupado === "status" ? (
            <LoaderCircle className="spin w-3.5 h-3.5 text-faint" aria-hidden />
          ) : (
            <StatusDot status={status} />
          )}
        </span>
        <select
          aria-label="Status do edital"
          className="select appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-55"
          style={{
            width: "auto",
            height: "2.25rem",
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: "1.75rem",
            paddingRight: "2rem",
            fontWeight: 500,
          }}
          value={status}
          disabled={ocupado !== null}
          onChange={(e) => mudarStatus(e.target.value)}
        >
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faint"
          aria-hidden
        />
      </div>

      <button
        className="btn btn-secondary"
        onClick={analisar}
        disabled={ocupado !== null}
      >
        {ocupado === "analisar" ? (
          <>
            <LoaderCircle className="spin" aria-hidden />
            Analisando…
          </>
        ) : (
          <>
            <Target aria-hidden />
            Analisar match
          </>
        )}
      </button>

      <button
        className="btn btn-primary"
        onClick={gerarProposta}
        disabled={ocupado !== null}
      >
        {ocupado === "proposta" ? (
          <>
            <LoaderCircle className="spin" aria-hidden />
            Escrevendo…
          </>
        ) : (
          <>
            <PenLine aria-hidden />
            Gerar proposta
          </>
        )}
      </button>

      {msg && (
        <p
          role="status"
          className={`basis-full flex items-start justify-end gap-1.5 text-[0.8125rem] ${
            msgEmAndamento ? "text-muted" : "text-danger"
          }`}
        >
          {!msgEmAndamento && <CircleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />}
          <span className="max-w-[60ch] text-right">{msg}</span>
        </p>
      )}
    </div>
  );
}
