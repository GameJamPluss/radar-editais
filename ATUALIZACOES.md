# 📋 Atualizações do Radar de Editais

Registro de tudo que cada pessoa (através do seu Claude) altera no projeto, para que **ambos saibam
o que o outro mudou**.

**Regra:** toda alteração ganha uma entrada nova **no topo** desta lista, no formato abaixo.

```
## AAAA-MM-DD — [Seu nome]
**O que mudou:** (resumo em 1–3 frases)
**Por quê:** (motivo)
**Arquivos:** (principais arquivos tocados)
**Deploy:** (automático via push na main / não se aplica)
```

---

## 2026-09-25 — Igor (via Claude) — Tema escuro
**O que mudou:** Botão **Tema escuro / Tema claro** no rodapé do menu lateral. A escolha fica salva no
navegador; na primeira visita segue o tema do sistema. Os tokens de cor ganharam uma versão escura
(`:root[data-theme="dark"]` em `app/globals.css`), com destaque e status clareados para manter contraste
AA. Um script no `<head>` aplica o tema antes de pintar (sem piscar).
**Por quê:** Pedido do Igor para a apresentação.
**Arquivos:** `app/globals.css`, `app/layout.tsx`, `components/sidebar.tsx`
**Deploy:** via `vercel deploy --prod`

## 2026-09-25 — Igor (via Claude) — Redesign visual: tema claro e sóbrio, sem emojis
**O que mudou:** Todo o app ganhou um visual novo, de ferramenta interna profissional: tema claro com
neutros quentes, uma única cor de destaque (ameixa, da marca GameJam+), bordas finas no lugar de
brilho/gradiente neon, e ícones **Lucide** no lugar de todos os emojis (menu, status, pilares, fontes,
botões e mensagens). Status agora é ponto colorido + texto. Menu reorganizado em "Captação" e "Base"
("Escritos" virou **Propostas**, "Dashboard" virou **Visão geral**). Todas as páginas usam os mesmos
primitivos novos em `components/ui.tsx` (`PageHeader`, `SectionHeader`, `Stat`, `EmptyState`,
`StatusBadge`, `PilarLabel`...). A tela de login ficou sem menu lateral.
**Correção junto:** prazos no formato "só data" (`2026-09-30`) eram lidos como meia-noite UTC e, no
Brasil, apareciam um dia antes e como **encerrados no próprio último dia**. Agora todo cálculo de
data/prazo usa o calendário de São Paulo (`fmtData` / `diasRestantes` em `components/ui.tsx`).
**Por quê:** Apresentação para a diretoria; o visual anterior (neon + emojis) tinha "cara de SaaS
feito por IA".
**Observação:** nenhuma consulta, rota ou regra de negócio mudou. `lib/sql.ts` passou a desligar SSL
só quando o banco é `localhost` (para pré-visualizar com um Postgres local); em produção segue
`ssl: require`. Nova dependência: `lucide-react`.
**Arquivos:** `app/globals.css` (tokens do tema), `components/ui.tsx`, `components/sidebar.tsx`,
`app/layout.tsx`, todas as páginas em `app/**/page.tsx`, `components/*.tsx`,
`lib/fontes-catalogo.ts` (sem emoji), `lib/sql.ts`, `package.json`.
**Deploy:** via `vercel deploy --prod` (o projeto da Vercel ainda está ligado ao repo antigo
`igorggvet-creator/radar-editais`; push na main do GameJamPluss não publica sozinho. Religar o Git
na Vercel é o próximo passo)

## 2026-07-23 — Milena — Pipeline: coluna "match" só com score acima de 50
**O que mudou:** No **🗂️ Pipeline**, a coluna **🎯 Match** passa a mostrar apenas os editais com
**score acima de 50**. As colunas **📡 Radar** e **🔍 Triagem** continuam mostrando todos, sem filtro.
A coluna ganhou a etiqueta "score > 50" no cabeçalho para deixar claro que está filtrada.
**Por quê:** Pedido da Milena — abaixo de 50 o "match" quase sempre é falso positivo da triagem por
palavras-chave (ex.: "Arte nas Ruas" 8, "Workshops de circulação artística" 15). Na prática dos 17
editais em match só 2 passam do corte (RIOFILME jogos 87 e Embratur 55), deixando a coluna confiável.
**Observação:** nada é apagado nem muda de status — os ocultos continuam acessíveis em
`/editais?status=match`. O limite fica na constante `SCORE_MIN_MATCH`, fácil de ajustar.
**Arquivos:** `app/pipeline/page.tsx`
**Deploy:** automático via push na main

## 2026-07-23 — Milena — Editais ordenados pelo prazo de inscrição
**O que mudou:** A aba **📑 Editais** agora lista do prazo de inscrição **mais próximo para o mais
distante**, em vez de por score. A ordem é: (1) **abertos**, do que fecha primeiro ao que fecha por
último; (2) os **sem prazo informado**; (3) os **já encerrados**, do que fechou mais recentemente
para o mais antigo. Empate dentro de cada grupo → maior score primeiro. Criei a constante
`ORDEM_POR_PRAZO` em `lib/db.ts` e apliquei também em `GET /api/editais`, para tela e API não
divergirem.
**Por quê:** Pedido da Milena — na captação o que importa é o que está vencendo primeiro. Ordenar
puramente por data crescente jogaria os editais já encerrados para o topo, por isso eles vão para o
fim da lista.
**Arquivos:** `lib/db.ts` (nova constante `ORDEM_POR_PRAZO`), `app/editais/page.tsx`,
`app/api/editais/route.ts`
**Deploy:** automático via push na main

## 2026-07-08 — Milena — Banco de Textos com 28 projetos catalogados
**O que mudou:** Criei um novo módulo `lib/banco-textos-projetos/` que cataloga 28 projetos
submetidos (12 Startup GRID/GJ+, 10 Acelera Indie e 6 Plug and Plus), extraídos de ~200 arquivos
(.docx/.pdf/.xlsx) das minhas pastas locais. Cada entrada tem projeto, patrocinador, ano, valor
solicitado, escopo, público-alvo, resultados, temas e pilar sugerido. Adicionei o endpoint
`/api/banco-textos-sync` (POST) e o botão **🔄 Sincronizar Banco de Textos** na tela
`/config` — clicar importa/atualiza tudo no Supabase (idempotente, dedup por empresa+categoria+título).
**Por quê:** Dar mais contexto pra IA gerar propostas melhores e fazer matches de editais mais
precisos, usando o histórico real de projetos escritos por cada empresa como referência.
**Arquivos:** `lib/banco-textos-projetos/import.ts` + `snapshot/projetos.json` (novos),
`app/api/banco-textos-sync/route.ts` (novo), `app/config/page.tsx` (botão de sincronização).
**Como usar:** No app em produção, entrar em Configurações e clicar em **🔄 Sincronizar Banco de
Textos** uma vez (leva ~2s). Depois disso os 28 projetos aparecem em `/banco-textos`.
**Deploy:** automático via push na main

## 2026-07-07 — Igor (via Claude) — página "Escritos" no menu
**O que mudou:** Novo item no menu da esquerda: **✍️ Escritos** (`/propostas`) — página que lista
todos os editais com proposta redigida (um card por edital, a proposta mais recente de cada), com
status (pronta/escrevendo/erro), empresa, pilar, data e link pra abrir e baixar (PDF/.docx).
**Por quê:** Pedido do Igor — ter um lugar único com todos os editais escritos.
**Arquivos:** `app/propostas/page.tsx` (novo índice), `components/sidebar.tsx` (item de menu)
**Deploy:** automático via push na main

## 2026-07-07 — Igor (via Claude) — export PDF estruturado das propostas
**O que mudou:** Botão **"Baixar PDF"** na página da proposta (`/propostas/[id]`). Gera um PDF
estruturado (A4, margens, tipografia de documento) a partir do texto da proposta usando o motor de
impressão do próprio navegador — funciona **igual no local e na Vercel**, sem dependência nova (nada
de puppeteer/chromium no build). Mantém o export **.docx** (agora botão secundário). Reaproveita o
HTML que a página já monta do Markdown.
**Por quê:** Pedido do Igor — precisava de um arquivo PDF já estruturado, não só o texto no banco/.docx.
**Arquivos:** `components/baixar-pdf.tsx` (novo), `app/propostas/[id]/page.tsx` (botão + reuso do HTML)
**Deploy:** automático via push na main

## 2026-07-07 — Igor (via Claude) — Nível "Com dependências" nas Fontes
**O que mudou:** Novo Nível na página **Fontes**: **🔗 Com dependências** — agrupa plataformas/programas
que exigem um pré-requisito antes de captar (ex.: precisar de um projeto já aprovado na Lei de
Incentivo/Rouanet). Começou com **PROMAC**, **ISS Rio** e **Chamada Cultural Vale** (leis de incentivo),
que saíram do Nível 3 para esse nível. Implementado com um flag `dependencia` no catálogo de fontes.
**Por quê:** Pedido do Igor — ter, nas Fontes, um nível para plataformas com dependência.
**Arquivos:** `lib/fontes-catalogo.ts` (NIVEIS_FONTE nível 6 + flag `dependencia` em promac/iss-rio/vale-cultural), `app/fontes/page.tsx` (render do nível)
**Deploy:** automático via push na main

## 2026-07-07 — Igor (via Claude) — novo nível "Com dependência"
**O que mudou:** Novo nível no pipeline: **🔗 Com dependência**. É um lugar separado para editais que
dão *match* mas dependem de outra coisa antes (ex.: precisar de um Rouanet aprovado para viabilizar
outro projeto). O edital vira uma coluna própria no `/pipeline`, aparece no filtro de `/editais` e no
seletor de status do edital; e a reanálise **não** o puxa de volta para "match" (mesma proteção que
escrita/submetido/descartado já têm). **Sem migração de banco** — o campo `status` é texto livre.
**Por quê:** Pedido da colaboradora (áudio) — um match não deve entrar direto na fila ativa quando tem dependência.
**Arquivos:** `components/ui.tsx` (STATUS_META), `app/api/editais/[id]/route.ts` (STATUS_VALIDOS), `app/pipeline/page.tsx` (COLUNAS + grade 6 colunas)
**Deploy:** automático via push na main

## 2026-07-01 — Igor (via Claude) — sincronização automática
**O que mudou:** As regras do `CLAUDE.md` passaram a incluir a sincronização como PRIMEIRO passo de
qualquer alteração (`git pull --rebase --autostash`), então o Claude puxa as novidades da equipe
sozinho antes de mexer em algo. O `PROMPT-COLABORADOR.md` foi simplificado — a pessoa só descreve a
mudança; sincronizar, registrar e publicar acontecem pelas regras do projeto.
**Por quê:** Tirar o passo-a-passo manual; a pessoa só descreve o que quer e o resto acontece sozinho.
**Arquivos:** `CLAUDE.md`, `PROMPT-COLABORADOR.md`
**Deploy:** automático via push na main

## 2026-07-01 — Igor (via Claude)
**O que mudou:** Configurada a colaboração no repositório — criados `CLAUDE.md` (guia do projeto +
regras de colaboração), este `ATUALIZACOES.md` (registro de mudanças) e `PROMPT-COLABORADOR.md`
(instruções prontas para quem for ajudar).
**Por quê:** Permitir que duas pessoas trabalhem no projeto com clareza, cada uma sabendo o que a
outra alterou.
**Arquivos:** `CLAUDE.md`, `ATUALIZACOES.md`, `PROMPT-COLABORADOR.md`
**Deploy:** automático via push na main

## 2026-07-01 — Igor (via Claude) — estado inicial
**O que já existia:** App publicado no GitHub (repositório privado) e conectado à Vercel para deploy
automático a cada push. Antes disso: banco migrado para o Supabase; varredura completa de editais
(+35 novos, 396 no total, 333 com prazo aberto) e reanálise de qualidade de 100 editais, limpando
~66 falsos positivos do pipeline (ficaram 24 "match" confiáveis).
**Arquivos:** projeto inteiro (commit inicial `cffb321`)
**Deploy:** produção em https://radar-editais-nine.vercel.app
