import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, Download, LoaderCircle } from "lucide-react";
import { one } from "@/lib/db";
import { fmtData, PageHeader } from "@/components/ui";
import { BaixarPdf } from "@/components/baixar-pdf";

export const dynamic = "force-dynamic";

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mdInline = (s: string) =>
  s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

const ehLinhaTabela = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const ehSeparadorTabela = (l: string) =>
  /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes("-");
function celulas(line: string): string[] {
  let l = line.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|")) l = l.slice(0, -1);
  return l.split("|").map((c) => c.trim());
}

function mdParaHtml(md: string): string {
  // markdown para HTML com suporte a tabelas, títulos, negrito, listas e citações
  const lines = escHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${para.join("<br/>")}</p>`);
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // tabela
    if (ehLinhaTabela(line) && i + 1 < lines.length && ehSeparadorTabela(lines[i + 1])) {
      flush();
      const header = celulas(line);
      i += 2;
      const corpo: string[][] = [];
      while (i < lines.length && ehLinhaTabela(lines[i])) {
        corpo.push(celulas(lines[i]));
        i++;
      }
      i--;
      const ths = header.map((c) => `<th>${mdInline(c)}</th>`).join("");
      const trs = corpo
        .map(
          (r) =>
            `<tr>${header
              .map((_, j) => `<td>${mdInline(r[j] ?? "")}</td>`)
              .join("")}</tr>`
        )
        .join("");
      out.push(`<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      out.push(`<h${h[1].length}>${mdInline(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      out.push(`<blockquote>${mdInline(line.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      out.push(`<li>${mdInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flush();
      out.push("<hr/>");
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    para.push(mdInline(line));
  }
  flush();
  return out.join("\n");
}

export default async function PropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await one<{
    id: number;
    edital_id: number;
    titulo: string;
    conteudo: string;
    modo: string;
    status: string;
    criado_em: string;
  }>("SELECT * FROM propostas WHERE id = ?", [id]);
  if (!p) notFound();

  const conteudoHtml = mdParaHtml(p.conteudo);
  const gerando = p.status === "gerando";
  const erro = p.status === "erro";

  const descricao = gerando
    ? `Em redação desde ${fmtData(p.criado_em)}.`
    : erro
      ? `Tentativa de ${fmtData(p.criado_em)}. A geração não foi concluída.`
      : `Gerado via ${p.modo} em ${fmtData(p.criado_em)}. Revise antes de submeter.`;

  return (
    <div className="max-w-4xl">
      {/* enquanto gera, recarrega a página a cada 5s para mostrar quando ficar pronta */}
      {gerando && <meta httpEquiv="refresh" content="5" />}

      <PageHeader
        eyebrow={`Rascunho #${p.id}`}
        title={p.titulo ?? "Proposta"}
        description={descricao}
        actions={
          <>
            <Link href={`/editais/${p.edital_id}`} className="btn btn-quiet">
              <ArrowLeft aria-hidden />
              Voltar ao edital
            </Link>
            {!gerando && !erro && (
              <>
                <a href={`/api/propostas/${p.id}/docx`} className="btn btn-secondary">
                  <Download aria-hidden />
                  Baixar .docx
                </a>
                <BaixarPdf
                  titulo={p.titulo ?? "Proposta"}
                  html={conteudoHtml}
                  meta={`Rascunho #${p.id} · ${fmtData(p.criado_em)} · Revisar antes de submeter`}
                />
              </>
            )}
          </>
        }
      />

      {gerando ? (
        <div role="status" className="card flex items-start gap-4 px-6 py-6">
          <LoaderCircle className="w-5 h-5 mt-0.5 shrink-0 spin text-accent" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink">Escrevendo a proposta</div>
            <p className="mt-1 text-sm text-muted leading-relaxed max-w-[62ch]">
              O Claude está moldando o banco de textos ao objeto deste edital. Costuma levar
              de <span className="font-medium text-ink-2">1 a 4 minutos</span>. Esta página
              atualiza sozinha quando o rascunho ficar pronto, pode deixar aberta.
            </p>
          </div>
        </div>
      ) : erro ? (
        <div
          role="alert"
          className="flex items-start gap-4 rounded-[10px] border border-border bg-danger-soft px-6 py-5"
        >
          <CircleAlert className="w-5 h-5 mt-0.5 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-medium text-danger">Falha ao gerar a proposta</div>
            <p className="mt-1 text-sm text-ink-2 leading-relaxed break-words max-w-[72ch]">
              {p.conteudo}
            </p>
            <Link href={`/editais/${p.edital_id}`} className="btn btn-secondary btn-sm mt-4">
              <ArrowLeft aria-hidden />
              Voltar e tentar de novo
            </Link>
          </div>
        </div>
      ) : (
        <article className="card px-6 py-8 sm:px-12 sm:py-11">
          <div
            className="prose-edital [&>:first-child]:mt-0! [&_hr]:my-6 [&_hr]:border-border"
            dangerouslySetInnerHTML={{ __html: conteudoHtml }}
          />
        </article>
      )}
    </div>
  );
}
