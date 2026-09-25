import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radar de Editais · GameJam+, Indie Hero e Plug and Plus",
  description:
    "Monitora, analisa e escreve editais para o ecossistema GameJam+ / Indie Hero / Plug and Plus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="px-10 pt-9 pb-16 max-w-[1320px] mx-auto w-full">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
