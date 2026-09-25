"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building,
  FileText,
  Globe,
  LayoutDashboard,
  Library,
  Moon,
  PenLine,
  Radar,
  Settings,
  SquareKanban,
  Sun,
  type LucideIcon,
} from "lucide-react";

// Alterna data-theme no <html> e lembra a escolha (o script em
// app/layout.tsx reaplica na próxima visita, antes de pintar).
function ThemeToggle() {
  const [tema, setTema] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    // reaplica o tema salvo: se a hidratação cair para render no cliente,
    // o React recria os atributos do <html> e o data-theme do script se perde
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem("radar-tema");
    } catch {}
    const t = salvo === "light" ? "light" : "dark"; // padrão: escuro
    document.documentElement.dataset.theme = t;
    setTema(t);
  }, []);
  const escuro = tema === "dark";
  const alternar = () => {
    const novo = escuro ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem("radar-tema", novo);
    } catch {}
    setTema(novo);
  };
  const Icon = escuro ? Sun : Moon;
  return (
    <button type="button" onClick={alternar} className="nav-link w-full text-left" aria-pressed={escuro}>
      <Icon aria-hidden />
      {escuro ? "Tema claro" : "Tema escuro"}
    </button>
  );
}

const GRUPOS: { titulo: string; links: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    titulo: "Captação",
    links: [
      { href: "/", label: "Visão geral", icon: LayoutDashboard },
      { href: "/editais", label: "Editais", icon: FileText },
      { href: "/pipeline", label: "Pipeline", icon: SquareKanban },
      { href: "/propostas", label: "Propostas", icon: PenLine },
    ],
  },
  {
    titulo: "Base",
    links: [
      { href: "/fontes", label: "Fontes", icon: Globe },
      { href: "/banco-textos", label: "Banco de textos", icon: Library },
      { href: "/empresas", label: "Empresas e CNPJs", icon: Building },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const ativo = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface px-3 py-5 flex flex-col sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2.5 px-2.5 pb-6">
        <span className="w-8 h-8 rounded-[7px] bg-accent text-surface flex items-center justify-center">
          <Radar className="w-[18px] h-[18px]" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[0.9375rem] font-semibold leading-tight text-ink">
            Radar de Editais
          </span>
          <span className="block text-[0.6875rem] text-muted leading-tight mt-0.5">
            GameJam+ · Indie Hero · Plug and Plus
          </span>
        </span>
      </Link>

      <nav className="flex flex-col gap-5" aria-label="Principal">
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="flex flex-col gap-0.5">
            <div className="eyebrow px-2.5 pb-1.5">{g.titulo}</div>
            {g.links.map((l) => {
              const Icon = l.icon;
              const on = ativo(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-link ${on ? "active" : ""}`}
                  aria-current={on ? "page" : undefined}
                >
                  <Icon aria-hidden />
                  {l.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5">
        <ThemeToggle />
        <Link
          href="/config"
          className={`nav-link ${ativo("/config") ? "active" : ""}`}
          aria-current={ativo("/config") ? "page" : undefined}
        >
          <Settings aria-hidden />
          Configurações
        </Link>
        <p className="px-2.5 pt-3 text-[0.6875rem] text-muted leading-relaxed">
          Varredura automática toda segunda às 9h. Busca sob demanda pelo Telegram.
        </p>
      </div>
    </aside>
  );
}
