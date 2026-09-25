"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, LoaderCircle, LogIn, Radar } from "lucide-react";

function LoginForm() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) throw new Error((await res.json()).erro ?? "falha");
      router.replace(params.get("from") || "/");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
      setEntrando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="card w-full max-w-[23rem]">
      <div className="border-b border-border px-7 pb-6 pt-7">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-accent text-surface">
            <Radar className="h-4 w-4" aria-hidden />
          </span>
          <h1 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
            Radar de Editais
          </h1>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Acesso restrito à equipe GameJam+, Indie Hero e Plug and Plus.
        </p>
      </div>

      <div className="space-y-4 px-7 py-6">
        <div>
          <label htmlFor="senha" className="label">
            Senha de acesso
          </label>
          <input
            id="senha"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? "login-erro" : undefined}
            className="input"
          />
        </div>

        {erro && (
          <p id="login-erro" role="alert" className="flex items-start gap-1.5 text-sm text-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{erro}</span>
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={entrando}>
          {entrando ? <LoaderCircle className="spin" aria-hidden /> : <LogIn aria-hidden />}
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
