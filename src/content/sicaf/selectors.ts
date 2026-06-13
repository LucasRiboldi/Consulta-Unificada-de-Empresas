/**
 * Seletores CSS e extração de dados do portal SICAF (Comprasnet).
 *
 * ATENÇÃO: seletores frágeis — qualquer redesign do portal quebra estes seletores.
 * Ao atualizar, incrementar SELECTORS_VERSION e registrar o que mudou.
 *
 * Validados em: 2026-06-12 (https://www.comprasnet.gov.br/seguro/loginPortal.asp → SICAF)
 */

export const SELECTORS_VERSION = '1.0.0';

/** Seletores da página de consulta de habilitação do fornecedor */
const SEL = {
  /** CNPJ exibido na página (formato: 00.000.000/0000-00) */
  cnpj: 'table.dadosFornecedor td[id*="cnpj"], td:contains("CNPJ") + td, #cnpj',

  /** Razão social */
  razaoSocial: 'table.dadosFornecedor td[id*="razaoSocial"], #razaoSocial',

  /** Nome fantasia */
  nomeFantasia: 'table.dadosFornecedor td[id*="nomeFantasia"], #nomeFantasia',

  /** UF de registro */
  uf: 'table.dadosFornecedor td[id*="uf"], #uf',

  /** Status de habilitação (ex.: "Habilitado", "Suspenso", "Impedido") */
  statusHabilitacao: '.situacaoCadastral, #situacao, td[id*="situacao"]',

  /** Tabela de sócios — linha de cada sócio */
  sociosLinha: 'table#tbSocios tr:not(:first-child), table.socios tbody tr',

  /** Dentro de cada linha de sócio */
  socio: {
    nome: 'td:nth-child(1)',
    cpf: 'td:nth-child(2)',
    qualificacao: 'td:nth-child(3)',
    dataEntrada: 'td:nth-child(4)',
  },
} as const;

export interface SicafSocio {
  readonly nome: string;
  readonly cpf: string;
  readonly qualificacao: string | null;
  readonly dataEntradaSociedade: string | null;
}

export interface SicafExtraido {
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeFantasia: string | null;
  readonly uf: string | null;
  readonly habilitado: boolean;
  readonly statusHabilitacao: string | null;
  readonly socios: readonly SicafSocio[];
  readonly seletoresVersao: string;
}

function texto(el: Element | null): string {
  return el?.textContent?.trim() ?? '';
}

function encontrar(seletor: string, contexto: Document | Element = document): Element | null {
  try {
    return contexto.querySelector(seletor);
  } catch {
    return null;
  }
}

function encontrarTodos(seletor: string, contexto: Document | Element = document): Element[] {
  try {
    return Array.from(contexto.querySelectorAll(seletor));
  } catch {
    return [];
  }
}

/** Extrai dados do SICAF da página atual. Retorna null se a página não for reconhecida. */
export function extractSicafData(doc: Document = document): SicafExtraido | null {
  const cnpjEl = encontrar(SEL.cnpj, doc);
  const razaoSocialEl = encontrar(SEL.razaoSocial, doc);

  const cnpjRaw = texto(cnpjEl);
  const razaoSocial = texto(razaoSocialEl);

  // Página não reconhecida se não encontrar campos mínimos
  if (!cnpjRaw || !razaoSocial) return null;

  const cnpj = cnpjRaw.replace(/\D/g, '');
  if (cnpj.length !== 14) return null;

  const statusRaw = texto(encontrar(SEL.statusHabilitacao, doc)).toLowerCase();
  const habilitado =
    statusRaw.includes('habilitado') && !statusRaw.includes('não') && !statusRaw.includes('nao');

  const linhas = encontrarTodos(SEL.sociosLinha, doc);
  const socios: SicafSocio[] = linhas
    .map((linha) => {
      const nome = texto(encontrar(SEL.socio.nome, linha));
      const cpfRaw = texto(encontrar(SEL.socio.cpf, linha));
      const cpf = cpfRaw.replace(/\D/g, '');

      if (!nome || cpf.length !== 11) return null;

      return {
        nome,
        cpf,
        qualificacao: texto(encontrar(SEL.socio.qualificacao, linha)) || null,
        dataEntradaSociedade: texto(encontrar(SEL.socio.dataEntrada, linha)) || null,
      } satisfies SicafSocio;
    })
    .filter((s): s is SicafSocio => s !== null);

  return {
    cnpj,
    razaoSocial,
    nomeFantasia: texto(encontrar(SEL.nomeFantasia, doc)) || null,
    uf: texto(encontrar(SEL.uf, doc)) || null,
    habilitado,
    statusHabilitacao: statusRaw || null,
    socios,
    seletoresVersao: SELECTORS_VERSION,
  };
}
