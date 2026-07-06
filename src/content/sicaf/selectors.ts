/**
 * Extração de dados do portal SICAF (Comprasnet).
 *
 * A detecção das colunas da tabela de sócios é feita PELO TEXTO DO CABEÇALHO,
 * não por posição fixa — isso sobrevive a reordenação de colunas. A estrutura
 * real observada (2026-06-13) é:
 *
 *   | CPF / CNPJ | Nome / Razão social | Participação Societária (%) | Possui pendência | Ação |
 *
 * O sócio majoritário é identificado pelo MAIOR percentual de participação,
 * ignorando administradores sem participação (coluna "-").
 */

export const SELECTORS_VERSION = '2.0.0';

export interface SicafSocio {
  readonly nome: string;
  /** Só dígitos: 11 (CPF) ou 14 (CNPJ). */
  readonly documento: string;
  readonly tipoDocumento: 'cpf' | 'cnpj';
  /** Percentual de participação societária (ex.: 57.5). null = administrador sem participação. */
  readonly participacaoSocietaria: number | null;
  readonly possuiPendencia: boolean | null;
}

export interface SicafExtraido {
  readonly cnpj: string;
  readonly razaoSocial: string | null;
  readonly nomeFantasia: string | null;
  readonly uf: string | null;
  /** null = não foi possível determinar nesta página. */
  readonly habilitado: boolean | null;
  readonly statusHabilitacao: string | null;
  readonly socios: readonly SicafSocio[];
  readonly seletoresVersao: string;
}

function texto(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Lê o VALOR de uma célula de tabela do SICAF.
 * As tabelas PrimeFaces responsivas embutem o rótulo da coluna em cada célula
 * (`<span class="ui-column-title">CPF</span><label class="ui-outputlabel informacao">VALOR</label>`),
 * então não basta `textContent`. Prioriza o elemento de valor; senão remove o rótulo.
 */
function valorCelula(cell: Element | null | undefined): string {
  if (!cell) return '';
  const valorEl = cell.querySelector('.ui-outputlabel, label.informacao, .informacao');
  if (valorEl) return texto(valorEl);
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll('.ui-column-title').forEach((s) => s.remove());
  return texto(clone);
}

/** Converte "57,500000" → 57.5; "-" ou "" → null. */
function parsePercentual(s: string): number | null {
  const limpo = s.trim();
  if (!limpo || limpo === '-') return null;
  const n = Number.parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Localiza a tabela de sócios pelo conteúdo do cabeçalho (CPF + participação/nome). */
function acharTabelaSocios(doc: Document): HTMLTableElement | null {
  const tabelas = Array.from(doc.querySelectorAll('table'));
  for (const t of tabelas) {
    const cabecalho = (t.querySelector('tr')?.textContent ?? '').toLowerCase();
    const temCpf = cabecalho.includes('cpf');
    const temParticipacao = cabecalho.includes('participa');
    const temNome = cabecalho.includes('nome') || cabecalho.includes('razão');
    if (temCpf && (temParticipacao || temNome)) {
      return t as HTMLTableElement;
    }
  }
  return null;
}

interface MapaColunas {
  readonly doc: number;
  readonly nome: number;
  readonly participacao: number;
  readonly pendencia: number;
}

function mapearColunas(tabela: HTMLTableElement): MapaColunas {
  const headerRow = tabela.querySelector('tr');
  const celulas = Array.from(headerRow?.querySelectorAll('th, td') ?? []);
  const idx = (palavras: string[]): number =>
    celulas.findIndex((c) => {
      const t = (c.textContent ?? '').toLowerCase();
      return palavras.some((p) => t.includes(p));
    });

  return {
    doc: idx(['cpf', 'cnpj']),
    nome: idx(['nome', 'razão', 'razao']),
    participacao: idx(['participa']),
    pendencia: idx(['pendência', 'pendencia']),
  };
}

function extrairSocios(doc: Document): SicafSocio[] {
  const tabela = acharTabelaSocios(doc);
  if (!tabela) return [];

  const col = mapearColunas(tabela);
  if (col.doc === -1 || col.nome === -1) return [];

  const linhas = Array.from(tabela.querySelectorAll('tr'));
  const socios: SicafSocio[] = [];

  for (const linha of linhas) {
    const celulas = Array.from(linha.querySelectorAll('td'));
    if (celulas.length === 0) continue; // linha de cabeçalho (th)

    const docRaw = valorCelula(celulas[col.doc]);
    const documento = docRaw.replace(/\D/g, '');
    const nome = valorCelula(celulas[col.nome]);

    if (!nome || (documento.length !== 11 && documento.length !== 14)) continue;

    const participacao =
      col.participacao !== -1 ? parsePercentual(valorCelula(celulas[col.participacao])) : null;

    let possuiPendencia: boolean | null = null;
    if (col.pendencia !== -1) {
      const p = valorCelula(celulas[col.pendencia]).toLowerCase();
      if (p === 'sim') possuiPendencia = true;
      else if (p === 'não' || p === 'nao') possuiPendencia = false;
    }

    socios.push({
      nome,
      documento,
      tipoDocumento: documento.length === 14 ? 'cnpj' : 'cpf',
      participacaoSocietaria: participacao,
      possuiPendencia,
    });
  }

  return socios;
}

/** Procura o CNPJ da empresa na página. Se `esperado` estiver presente, confirma-o. */
function extrairCnpjEmpresa(doc: Document, esperado?: string): string {
  const texto = doc.body?.innerText ?? doc.body?.textContent ?? '';
  const matches = texto.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g) ?? [];
  const digits = matches.map((m) => m.replace(/\D/g, '')).filter((d) => d.length === 14);
  if (esperado && digits.includes(esperado)) return esperado;
  return digits[0] ?? '';
}

/** Busca o valor associado a um rótulo (procura label e pega o texto vizinho). */
function valorPorRotulo(doc: Document, rotulos: string[]): string | null {
  const candidatos = Array.from(doc.querySelectorAll('label, th, td, span, dt, strong, b'));
  for (const el of candidatos) {
    const t = texto(el).toLowerCase().replace(/:$/, '');
    if (rotulos.some((r) => t === r || t.startsWith(r))) {
      const irmao = el.nextElementSibling;
      const valor = texto(irmao);
      if (valor) return valor;
    }
  }
  return null;
}

/**
 * Extrai dados do SICAF da página atual. Retorna null se a página não for reconhecida.
 * @param expectedCnpj CNPJ (14 dígitos) que o usuário consultou — usado p/ confirmar a página.
 */
export function extractSicafData(
  doc: Document = document,
  expectedCnpj?: string,
): SicafExtraido | null {
  const socios = extrairSocios(doc);
  const cnpj = extrairCnpjEmpresa(doc, expectedCnpj);

  // Página não reconhecida: sem CNPJ e sem quadro societário.
  if (!cnpj && socios.length === 0) return null;

  const statusOriginal = valorPorRotulo(doc, ['situação do fornecedor', 'situação', 'situacao']);
  const statusRaw = (statusOriginal ?? '').toLowerCase();

  // Conservador: só marca false em status explicitamente negativos; "Credenciado"/
  // "Habilitado"/"Cadastrado" → true; desconhecido → null (não vira pendência).
  let habilitado: boolean | null = null;
  if (statusRaw) {
    const negativo =
      /suspenso|impedido|inativ|inidône|inidone|cancelad|n[ãa]o credenciad|n[ãa]o habilitad/.test(
        statusRaw,
      );
    const positivo = /credenciad|habilitad|cadastrad|regular/.test(statusRaw);
    if (negativo) habilitado = false;
    else if (positivo) habilitado = true;
  }

  return {
    cnpj,
    razaoSocial: valorPorRotulo(doc, ['razão social', 'razao social', 'nome empresarial']),
    nomeFantasia: valorPorRotulo(doc, ['nome fantasia', 'nome de fantasia']),
    uf: valorPorRotulo(doc, ['uf', 'unidade da federação']),
    habilitado,
    statusHabilitacao: statusOriginal,
    socios,
    seletoresVersao: SELECTORS_VERSION,
  };
}

/**
 * Identifica o sócio majoritário: o de MAIOR participação societária.
 * Ignora administradores sem participação (percentual null). Empata pelo primeiro.
 * Retorna null se nenhum sócio tiver percentual informado.
 */
export function socioMajoritarioSicaf(socios: readonly SicafSocio[]): SicafSocio | null {
  const comParticipacao = socios.filter((s) => s.participacaoSocietaria !== null);
  if (comParticipacao.length === 0) return null;
  return comParticipacao.reduce((maior, s) =>
    (s.participacaoSocietaria ?? 0) > (maior.participacaoSocietaria ?? 0) ? s : maior,
  );
}

function rotuloDoCampo(i: HTMLInputElement): string {
  const label = i.labels?.[0]?.textContent ?? '';
  return `${i.id} ${i.name} ${label} ${i.placeholder ?? ''}`.toLowerCase();
}

/** Formata 14 dígitos em 00.000.000/0000-00. */
function formatarCnpj(digits: string): string {
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Preenche o CNPJ no formulário de busca do SICAF e dispara a pesquisa.
 * Determinístico — sem IA. Localiza o campo pela presença de "cnpj" no id/name/label
 * e o botão de submit no mesmo formulário. Marca o radio "Quadro Societário" se houver.
 */
export function preencherCnpjEPesquisar(
  cnpj: string,
  doc: Document = document,
): { ok: boolean; error?: string } {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return { ok: false, error: 'CNPJ inválido.' };

  const radios = Array.from(doc.querySelectorAll<HTMLInputElement>('input[type=radio]'));
  const radioQuadro = radios.find((r) => /quadro/i.test(r.labels?.[0]?.textContent ?? ''));
  if (radioQuadro && !radioQuadro.checked) {
    radioQuadro.checked = true;
    radioQuadro.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const inputs = Array.from(doc.querySelectorAll<HTMLInputElement>('input[type=text]'));
  const cnpjInput = inputs.find((i) => /cnpj/.test(rotuloDoCampo(i)));
  if (!cnpjInput) return { ok: false, error: 'Campo CNPJ não encontrado na página.' };

  cnpjInput.focus();
  cnpjInput.value = formatarCnpj(digits);
  cnpjInput.dispatchEvent(new Event('input', { bubbles: true }));
  cnpjInput.dispatchEvent(new Event('change', { bubbles: true }));

  const form = cnpjInput.closest('form');
  const btn =
    form?.querySelector<HTMLElement>('button[type=submit], input[type=submit]') ??
    doc.querySelector<HTMLElement>('button[type=submit]');
  if (!btn) return { ok: false, error: 'Botão de pesquisa não encontrado.' };
  btn.click();
  return { ok: true };
}

/** Rótulos dos relatórios do SICAF (tela "Situação do Fornecedor - Resultado"). */
const ROTULO_RELATORIO =
  /n[íi]vel\s+[ivx]+|ocorr[êe]nc|situa[çc][ãa]o do fornecedor|credenciamento|habilita[çc][ãa]o jur|regularidade fiscal|qualifica[çc][ãa]o (?:t[ée]cnica|econ[óo]mic)/i;

/**
 * Lista os botões de relatório (verdes) da área de Resultado da tela "Situação do
 * Fornecedor". Detecta primeiro pelos ids JSF do bloco de resultado (`...:fornecedores:...`).
 * Como os ids JSF variam conforme a árvore de componentes, faz um fallback por RÓTULO
 * (Níveis I–VI, Ocorrências etc.) quando o filtro por id não encontra nada — restrito a
 * elementos clicáveis COM id (necessário para `clicarPorId`) e sem duplicar.
 */
export function listarRelatorios(doc: Document = document): { id: string; texto: string }[] {
  const els = Array.from(doc.querySelectorAll<HTMLElement>('a[id], button[id]'));
  const porId = els
    .filter((e) => /:fornecedores:/.test(e.id) && texto(e).length > 0)
    .map((e) => ({ id: e.id, texto: texto(e) }));
  if (porId.length > 0) return porId;

  const seen = new Set<string>();
  const out: { id: string; texto: string }[] = [];
  for (const e of els) {
    const t = texto(e);
    if (!e.id || !t || !ROTULO_RELATORIO.test(t) || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push({ id: e.id, texto: t });
  }
  return out;
}

/** Clica um elemento por id (ex.: botão de relatório). */
export function clicarPorId(id: string, doc: Document = document): { ok: boolean; error?: string } {
  const el = doc.getElementById(id);
  if (!el) return { ok: false, error: `Elemento ${id} não encontrado.` };
  (el as HTMLElement).click();
  return { ok: true };
}

/** Clica o botão "Download" do Contrato Social (Nível II), priorizando o mais próximo do rótulo. */
export function clicarContratoSocial(doc: Document = document): { ok: boolean; error?: string } {
  const botoes = Array.from(
    doc.querySelectorAll<HTMLElement>('a, button, input[type=submit]'),
  ).filter((b) => /^download$/i.test(texto(b) || (b as HTMLInputElement).value || ''));
  if (botoes.length === 0)
    return { ok: false, error: 'Botão Download do Contrato Social não encontrado.' };

  const perto = botoes.find((b) => {
    let n: Element | null = b;
    for (let i = 0; i < 6 && n; i++) {
      if (/contrato social|arquivo comprobat/i.test(n.textContent ?? '')) return true;
      n = n.parentElement;
    }
    return false;
  });
  (perto ?? botoes[0]!).click();
  return { ok: true };
}
