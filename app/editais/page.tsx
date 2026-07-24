import { all, EditalRow, ORDEM_POR_PRAZO } from "@/lib/db";
import { EditalCard, STATUS_META } from "@/components/ui";
import { ScanButton } from "@/components/scan-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditaisPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  let sqlText = "SELECT * FROM editais WHERE 1=1";
  const params: unknown[] = [];
  if (status) {
    sqlText += " AND status = ?";
    params.push(status);
  }
  if (q) {
    sqlText += " AND (nome ILIKE ? OR orgao ILIKE ? OR descricao ILIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  // Ordem por prazo de inscrição: abertos primeiro (do mais próximo ao mais
  // distante), depois os sem prazo informado e, por último, os já encerrados
  // (do que fechou mais recentemente para o mais antigo). Empate → maior score.
  sqlText += ORDEM_POR_PRAZO + " LIMIT 200";
  const editais = await all<EditalRow>(sqlText, params);

  const counts = await all<{ status: string; c: number }>(
    "SELECT status, COUNT(*)::int c FROM editais GROUP BY status"
  );
  const byStatus = Object.fromEntries(counts.map((s) => [s.status, s.c]));
  const total = counts.reduce((a, s) => a + s.c, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">📑 Editais</h1>
          <p className="text-muted mt-1">
            {editais.length} exibidos · {total} no total
          </p>
        </div>
        <ScanButton />
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/editais"
          className={`badge ${!status ? "border-fuchsia-400/60 text-fuchsia-200" : "border-border text-muted"}`}
        >
          todos ({total})
        </Link>
        {Object.entries(STATUS_META).map(([k, v]) => (
          <Link
            key={k}
            href={`/editais?status=${k}`}
            className={`badge ${status === k ? "border-fuchsia-400/60 text-fuchsia-200" : "border-border text-muted"}`}
          >
            {v.emoji} {v.label} ({byStatus[k] ?? 0})
          </Link>
        ))}
        <form className="ml-auto" action="/editais">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="buscar por nome, órgão, texto..."
            className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm w-72 outline-none focus:border-neon"
          />
        </form>
      </div>

      <div className="space-y-2">
        {editais.length === 0 && (
          <div className="card p-10 text-center text-muted">
            Nenhum edital aqui ainda. Rode uma varredura 📡 ou ajuste os filtros.
          </div>
        )}
        {editais.map((e) => (
          <EditalCard key={e.id} e={e} />
        ))}
      </div>
    </div>
  );
}
