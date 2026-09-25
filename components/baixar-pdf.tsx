"use client";

import { FileDown } from "lucide-react";

// Gera um PDF estruturado da proposta usando o motor de impressão do próprio
// navegador (funciona igual no local e na Vercel, sem dependência pesada).
// Monta um documento A4 isolado (iframe) com tipografia de documento e dispara
// o "Salvar como PDF". Reaproveita o HTML que a página já renderiza do markdown.

const PRINT_CSS = `
  @page { size: A4; margin: 2cm 2.2cm; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #1b1a17; line-height: 1.55; font-size: 10.5pt;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .meta { color: #6b675e; font-size: 8.5pt; letter-spacing: 0.02em; padding-bottom: 8pt; margin-bottom: 18pt; border-bottom: 1px solid #d8d4ca; }
  h1 { font-size: 18pt; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; margin: 0 0 8pt; }
  h2 { font-size: 13pt; font-weight: 600; margin: 18pt 0 6pt; border-bottom: 1px solid #d8d4ca; padding-bottom: 3pt; page-break-after: avoid; }
  h3 { font-size: 11pt; font-weight: 600; margin: 12pt 0 4pt; page-break-after: avoid; }
  h4 { font-size: 10.5pt; font-weight: 600; margin: 10pt 0 3pt; page-break-after: avoid; }
  p { margin: 0 0 7pt; color: #2e2c28; }
  ul { margin: 0 0 8pt 18pt; padding: 0; }
  li { margin: 0 0 3pt 16pt; color: #2e2c28; }
  blockquote { margin: 8pt 0; padding: 6pt 10pt; border: 1px solid #d8d4ca; background: #f6f5f1; color: #4a4740; }
  hr { border: none; border-top: 1px solid #d8d4ca; margin: 14pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0 10pt; page-break-inside: avoid; font-size: 9.5pt; }
  th, td { border: 1px solid #cfcbc1; padding: 4pt 7pt; text-align: left; vertical-align: top; }
  th { background: #f0eee9; font-weight: 600; }
  strong { font-weight: 600; }
`;

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

export function BaixarPdf({
  titulo,
  html,
  meta,
}: {
  titulo: string;
  html: string;
  meta?: string;
}) {
  function gerar() {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (!win) {
      iframe.remove();
      return;
    }
    const doc = win.document;
    doc.open();
    doc.write(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">` +
        `<title>${esc(titulo)}</title><style>${PRINT_CSS}</style></head>` +
        `<body>${meta ? `<div class="meta">${esc(meta)}</div>` : ""}${html}</body></html>`
    );
    doc.close();

    let limpo = false;
    const limpar = () => {
      if (limpo) return;
      limpo = true;
      setTimeout(() => iframe.remove(), 500);
    };
    win.onafterprint = limpar;
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(limpar, 60_000); // fallback se onafterprint não disparar
    }, 350);
  }

  return (
    <button
      type="button"
      onClick={gerar}
      className="btn btn-primary"
      title="Abre uma versão formatada em A4 para salvar como PDF"
    >
      <FileDown aria-hidden />
      Baixar PDF
    </button>
  );
}
