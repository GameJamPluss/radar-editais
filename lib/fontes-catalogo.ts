// Catálogo de FONTES de editais/patrocínio, categorizado em níveis.
// Nível 1 = agregador varrido automaticamente pelo radar (Prosas).
// Níveis 2-4 = universo de plataformas que o ecossistema monitora
// (extraído do Coda GJ+ Editais: "Outras plataformas", "Sebraes",
// "Solicitações de patrocínios"). Nível 5 = feeds RSS configuráveis.
// Nível 6 = plataformas com pré-requisito (flag `dependencia`).
//
// Sem segredos aqui: apenas nome, link, nível e quem usa. Os logins
// continuam só no Coda.

export interface NivelFonte {
  nivel: number;
  nome: string;
  descricao: string;
}

export const NIVEIS_FONTE: NivelFonte[] = [
  {
    nivel: 1,
    nome: "Agregadores (varredura automática)",
    descricao:
      "Plataformas que reúnem milhares de editais de todo o país, varridas automaticamente pelo radar.",
  },
  {
    nivel: 2,
    nome: "Fomento federal e internacionalização",
    descricao:
      "Agências e programas federais, além de missões e contests internacionais.",
  },
  {
    nivel: 3,
    nome: "Estaduais, municipais e leis de incentivo",
    descricao:
      "Fundações, secretarias e plataformas de leis de incentivo (Rouanet, ISS, ICMS).",
  },
  {
    nivel: 4,
    nome: "Patrocínio corporativo",
    descricao:
      "Empresas e institutos com editais e patrocínios diretos, incluindo leis de incentivo.",
  },
  {
    nivel: 5,
    nome: "Newsletters e feeds RSS",
    descricao:
      "Fontes configuráveis que entram na varredura automática via RSS ou Atom, na aba Configurações.",
  },
  {
    nivel: 6,
    nome: "Com dependências",
    descricao:
      "Plataformas e programas com pré-requisito. Só dá para captar depois de outra aprovação, como ter um projeto já aprovado na Lei de Incentivo (Rouanet).",
  },
];

export interface FonteCatalogo {
  slug: string;
  nome: string;
  url: string;
  nivel: number;
  tipo: string;
  noRadar: boolean; // varrido automaticamente?
  fonteSlug?: string; // casa com editais.fonte para contagem ao vivo
  empresas?: string[]; // contas/CNPJs que usam essa plataforma
  descricao?: string;
  dependencia?: boolean; // tem pré-requisito (ex.: precisa de aprovação em lei de incentivo antes), vai para o Nível 6
}

export const FONTES_CATALOGO: FonteCatalogo[] = [
  // ---------- Nível 1: agregador ativo ----------
  {
    slug: "prosas",
    nome: "Prosas · Central de Editais",
    url: "https://produtos.prosas.com.br/editais",
    nivel: 1,
    tipo: "Agregador",
    noRadar: true,
    fonteSlug: "prosas",
    descricao:
      "Maior central de editais do terceiro setor no Brasil, com mais de 13 mil oportunidades. Integração pela API oficial da Central: busca por palavra-chave e catálogo completo de inscrições abertas.",
  },

  // ---------- Nível 2: federal e internacional ----------
  {
    slug: "finep",
    nome: "FINEP",
    url: "https://www.finep.gov.br/",
    nivel: 2,
    tipo: "Fomento federal",
    noRadar: false,
    empresas: ["plug-and-plus", "acelera-indie"],
    descricao: "Financiadora de Estudos e Projetos. Inovação (programa Mais Inovação Brasil).",
  },
  {
    slug: "ancine",
    nome: "ANCINE",
    url: "https://www.gov.br/ancine/",
    nivel: 2,
    tipo: "Audiovisual federal",
    noRadar: false,
    empresas: ["startup-grid"],
    descricao: "Agência Nacional do Cinema. Fomento ao audiovisual.",
  },
  {
    slug: "apex",
    nome: "ApexBrasil · Patrocínios",
    url: "https://crm-apps-patrocinio.apexbrasil.com.br/",
    nivel: 2,
    tipo: "Internacionalização",
    noRadar: false,
    empresas: ["acelera-indie", "startup-grid"],
    descricao: "Agência de Promoção de Exportações. Missões e internacionalização.",
  },
  {
    slug: "sebrae-nacional",
    nome: "Sebrae (SGF e credenciamento nacional)",
    url: "https://sgf.sebrae.com.br/credenciado/",
    nivel: 2,
    tipo: "Fomento e credenciamento",
    noRadar: false,
    empresas: ["startup-grid", "acelera-indie"],
    descricao: "Sistema de Gestão de Fornecedores e credenciamentos regionais (RS, PE, PR, BA, CE, ES, DF, RJ, SC).",
  },
  {
    slug: "oei",
    nome: "OEI",
    url: "https://candidatos.sigoei.org.br/",
    nivel: 2,
    tipo: "Cooperação internacional",
    noRadar: false,
    empresas: ["acelera-indie"],
    descricao: "Organização dos Estados Ibero-americanos. Editais de educação e cultura.",
  },
  {
    slug: "micbr",
    nome: "MICBR",
    url: "https://www.gov.br/cultura/pt-br/assuntos/micbr",
    nivel: 2,
    tipo: "Internacionalização cultural",
    noRadar: false,
    empresas: ["acelera-indie"],
    descricao: "Missão e Investimentos da Cultura Brasileira no exterior.",
  },
  {
    slug: "embratur",
    nome: "Embratur · Patrocínio",
    url: "https://patrocinio.embratur.com.br/",
    nivel: 2,
    tipo: "Turismo federal",
    noRadar: false,
    empresas: ["startup-grid"],
    descricao: "Agência Brasileira de Promoção Internacional do Turismo.",
  },
  {
    slug: "brics-women",
    nome: "BRICS Women's Startups Contest",
    url: "https://bricswomen.com/brics-womensstartups-contest",
    nivel: 2,
    tipo: "Contest internacional",
    noRadar: false,
    empresas: ["acelera-indie"],
    descricao: "Competição internacional de startups lideradas por mulheres.",
  },

  // ---------- Nível 3: estaduais/municipais e leis de incentivo ----------
  {
    slug: "faperj",
    nome: "FAPERJ",
    url: "https://sisfaperj.faperj.br/",
    nivel: 3,
    tipo: "Fomento estadual (RJ)",
    noRadar: false,
    empresas: ["acelera-indie", "startup-grid", "plug-and-plus"],
    descricao: "Fundação de Amparo à Pesquisa do Estado do Rio de Janeiro.",
  },
  {
    slug: "spcine",
    nome: "Spcine · Editais",
    url: "https://spcineeditais.com.br/",
    nivel: 3,
    tipo: "Audiovisual (SP)",
    noRadar: false,
    empresas: ["acelera-indie"],
    descricao: "Empresa de cinema e audiovisual de São Paulo.",
  },
  {
    slug: "salic",
    nome: "SALIC · Lei Rouanet",
    url: "https://salic.cultura.gov.br/",
    nivel: 3,
    tipo: "Lei de incentivo (federal)",
    noRadar: false,
    empresas: ["startup-grid", "plug-and-plus"],
    descricao: "Sistema de Apoio às Leis de Incentivo à Cultura (Lei Rouanet).",
  },
  {
    slug: "promac",
    nome: "PROMAC · ISS São Paulo",
    url: "https://smcpromac.prefeitura.sp.gov.br/",
    nivel: 3,
    tipo: "Lei de incentivo (municipal SP)",
    noRadar: false,
    descricao: "Programa Municipal de Apoio a Projetos Culturais de São Paulo.",
    dependencia: true,
  },
  {
    slug: "brde",
    nome: "BRDE · Incentivos fiscais",
    url: "https://incentivosfiscais.brde.com.br/",
    nivel: 3,
    tipo: "Incentivos (Sul)",
    noRadar: false,
    empresas: ["plug-and-plus"],
    descricao: "Banco Regional de Desenvolvimento do Extremo Sul.",
  },
  {
    slug: "iss-rio",
    nome: "ISS Rio · Incentivo à cultura",
    url: "https://carioca.rio/",
    nivel: 3,
    tipo: "Lei de incentivo (municipal RJ)",
    noRadar: false,
    empresas: ["startup-grid"],
    descricao: "Lei do ISS de incentivo à cultura do município do Rio de Janeiro.",
    dependencia: true,
  },
  {
    slug: "vale-cultural",
    nome: "Chamada Cultural Vale",
    url: "https://institutoculturalvale.org/solicitacao-de-patrocinios/",
    nivel: 3,
    tipo: "Lei de incentivo (ICMS e Rouanet)",
    noRadar: false,
    empresas: ["startup-grid", "plug-and-plus"],
    descricao: "Instituto Cultural Vale. Lei Rouanet e Lei do Audiovisual.",
    dependencia: true,
  },

  // ---------- Nível 4: patrocínio corporativo ----------
  {
    slug: "petrobras",
    nome: "Petrobras · Patrocínios",
    url: "https://petrobras.com.br/sustentabilidade/patrocinios",
    nivel: 4,
    tipo: "Patrocínio corporativo",
    noRadar: false,
    descricao: "Patrocínios de cultura, esporte, ciência e meio ambiente.",
  },
  {
    slug: "itau-social",
    nome: "Itaú Social / Cubo Itaú",
    url: "https://www.itausocial.org.br/",
    nivel: 4,
    tipo: "Instituto corporativo",
    noRadar: false,
    empresas: ["plug-and-plus"],
    descricao: "Editais de educação integral e ecossistema de inovação (Cubo).",
  },
  {
    slug: "sicoob-credip",
    nome: "Sicoob Credip · Patrocínios e doações",
    url: "https://www.sicoob.com.br/web/sicoobcredip/patrocinios-doacoes",
    nivel: 4,
    tipo: "Patrocínio corporativo",
    noRadar: false,
    descricao: "Programa de patrocínios e doações do Sicoob Credip.",
  },
  {
    slug: "centelha",
    nome: "Programa Centelha",
    url: "https://programacentelha.com.br/",
    nivel: 4,
    tipo: "Aceleração (Finep/MCTI)",
    noRadar: false,
    empresas: ["plug-and-plus"],
    descricao: "Estímulo à criação de empreendimentos inovadores.",
  },
  {
    slug: "brada",
    nome: "Brada",
    url: "https://somosbrada.com.br/",
    nivel: 4,
    tipo: "Aceleração",
    noRadar: false,
    empresas: ["acelera-indie"],
    descricao: "Plataforma de aceleração e conexão com investidores.",
  },
];

export interface FonteResolvida {
  slug: string;
  nome: string;
  url: string | null;
  nivel: number | null;
}

/** Mapeia o campo `editais.fonte` para a plataforma-fonte do catálogo. */
export function fonteDeEdital(fonte: string | null): FonteResolvida {
  if (fonte === "prosas") {
    const p = FONTES_CATALOGO.find((f) => f.slug === "prosas")!;
    return { slug: p.slug, nome: "Prosas", url: p.url, nivel: 1 };
  }
  if (fonte === "rss") {
    return { slug: "rss", nome: "Feed RSS", url: null, nivel: 5 };
  }
  if (fonte === "ia") {
    return { slug: "ia", nome: "Busca IA", url: null, nivel: null };
  }
  return { slug: "manual", nome: "Manual", url: null, nivel: null };
}
