import { z } from 'zod';
import type {
  ConsultaContext,
  ConsultaProvider,
  ProviderResult,
  SujeitoSuportado,
} from './provider.types';

const SICAF_HOST = 'https://*.comprasnet.gov.br/*';

/** Tela do Quadro Societário — fonte mais limpa de sócios + dados da empresa (ver memória). */
const QUADRO_URL =
  'https://www3.comprasnet.gov.br/sicaf-web/private/consultas/consultarQuadroSocietario.jsf';

const PRONTO_TIMEOUT_MS = 12_000;
const EXTRACT_TIMEOUT_MS = 12_000;
const POLL_INTERVALO_MS = 500;

export const dormir = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export type ChromeApi = typeof globalThis.chrome;

export const SICAF_QUADRO_URL = QUADRO_URL;
export const SICAF_SITUACAO_URL =
  'https://www3.comprasnet.gov.br/sicaf-web/private/geral/consultarSituacaoFornecedor.jsf';
export const SICAF_NIVEL2_URL =
  'https://www3.comprasnet.gov.br/sicaf-web/private/consultas/consultarNivel2.jsf';

/** Aguarda o content script responder (página carregada no host do Comprasnet). */
export async function aguardarPronto(
  cr: ChromeApi,
  tabId: number,
  timeoutMs: number,
  pollMs: number,
): Promise<boolean> {
  const fim = Date.now() + timeoutMs;
  while (Date.now() < fim) {
    try {
      const r = (await cr.tabs.sendMessage(tabId, { type: 'SICAF_PING' })) as { ready?: boolean };
      if (r?.ready) return true;
    } catch {
      /* content script ainda não pronto ou página recarregando */
    }
    await dormir(pollMs);
  }
  return false;
}

/** Faz polling da extração até a página de resultado (com sócios/CNPJ) aparecer. */
async function pollExtrair(
  cr: ChromeApi,
  tabId: number,
  cnpj: string,
  timeoutMs: number,
  pollMs: number,
): Promise<unknown | null> {
  const fim = Date.now() + timeoutMs;
  while (Date.now() < fim) {
    try {
      const r = (await cr.tabs.sendMessage(tabId, { type: 'EXTRACT_SICAF_DATA', cnpj })) as {
        ok?: boolean;
        data?: { cnpj?: string; socios?: unknown[] } | null;
      };
      const d = r?.data;
      if (r?.ok && d && (d.cnpj === cnpj || (Array.isArray(d.socios) && d.socios.length > 0))) {
        return d;
      }
    } catch {
      /* página recarregando */
    }
    await dormir(pollMs);
  }
  return null;
}

const SocioSchema = z.object({
  nome: z.string(),
  documento: z.string(),
  tipoDocumento: z.enum(['cpf', 'cnpj']),
  participacaoSocietaria: z.number().nullable(),
  possuiPendencia: z.boolean().nullable(),
});

const SicafExtraidoSchema = z.object({
  cnpj: z.string().length(14),
  razaoSocial: z.string().nullable(),
  nomeFantasia: z.string().nullable(),
  uf: z.string().nullable(),
  habilitado: z.boolean().nullable(),
  statusHabilitacao: z.string().nullable(),
  socios: z.array(SocioSchema),
  seletoresVersao: z.string(),
});

export interface SicafSocio {
  readonly nome: string;
  /** Só dígitos: 11 (CPF) ou 14 (CNPJ). */
  readonly documento: string;
  readonly tipoDocumento: 'cpf' | 'cnpj';
  /** Percentual de participação (ex.: 57.5). null = administrador sem participação. */
  readonly participacaoSocietaria: number | null;
  readonly possuiPendencia: boolean | null;
}

export interface SicafData {
  readonly cnpj: string;
  readonly razaoSocial: string | null;
  readonly nomeFantasia: string | null;
  readonly uf: string | null;
  readonly habilitado: boolean | null;
  readonly statusHabilitacao: string | null;
  /** Sócios com CPF completo + participação — diferencial do SICAF vs BrasilAPI. */
  readonly socios: readonly SicafSocio[];
  readonly seletoresVersao: string;
}

interface Deps {
  /** Injete chrome para testes. */
  readonly chrome?: typeof globalThis.chrome;
  /** Override de timeouts (ms) — usado em testes para acelerar. */
  readonly timeouts?: {
    readonly prontoMs?: number;
    readonly extractMs?: number;
    readonly pollMs?: number;
  };
}

export function createSicafProvider(deps: Deps = {}): ConsultaProvider<SicafData> {
  const cr = deps.chrome ?? globalThis.chrome;
  const prontoMs = deps.timeouts?.prontoMs ?? PRONTO_TIMEOUT_MS;
  const extractMs = deps.timeouts?.extractMs ?? EXTRACT_TIMEOUT_MS;
  const pollMs = deps.timeouts?.pollMs ?? POLL_INTERVALO_MS;
  const suporta: readonly SujeitoSuportado[] = ['pj'];

  const meta = {
    id: 'sicaf' as const,
    label: 'SICAF — Habilitação + Sócios (Comprasnet)',
    access: 'content-script' as const,
    host: SICAF_HOST,
    enabled: false, // desabilitado por padrão; usuário ativa nas opções
  };

  return {
    meta,
    suporta,

    isReady(ctx: ConsultaContext): boolean {
      return meta.enabled && ctx.sujeito.tipo === 'pj';
    },

    async consultar(ctx: ConsultaContext): Promise<ProviderResult<SicafData>> {
      const fetchedAt = new Date().toISOString();
      const erro = (error: string): ProviderResult<SicafData> => ({
        providerId: meta.id,
        ok: false,
        error,
        fetchedAt,
      });

      if (ctx.sujeito.tipo !== 'pj') return erro('Fonte aceita apenas PJ.');
      const cnpj = ctx.sujeito.cnpj.replace(/\D/g, '');

      // Abre uma aba de trabalho em segundo plano na tela do Quadro Societário.
      // A sessão logada no Comprasnet (gov.br) é compartilhada no perfil do Chrome.
      let tabId: number | undefined;
      try {
        const tab = await cr.tabs.create({ url: QUADRO_URL, active: false });
        tabId = tab.id ?? undefined;
      } catch {
        return erro('Permissão do Comprasnet não concedida. Ative o SICAF nas opções.');
      }
      if (tabId === undefined) return erro('Não foi possível abrir a aba do SICAF.');

      try {
        if (!(await aguardarPronto(cr, tabId, prontoMs, pollMs))) {
          return erro(
            'Não foi possível acessar o SICAF. Faça login no Comprasnet (gov.br) e tente novamente.',
          );
        }

        // Preenche o CNPJ e dispara a pesquisa (a submissão recarrega a página).
        await cr.tabs
          .sendMessage(tabId, { type: 'SICAF_FILL_SEARCH', cnpj })
          .catch(() => undefined);
        await aguardarPronto(cr, tabId, prontoMs, pollMs);

        const data = await pollExtrair(cr, tabId, cnpj, extractMs, pollMs);
        if (!data) return erro('Tempo esgotado ao ler os dados do SICAF.');

        const parsed = SicafExtraidoSchema.safeParse(data);
        if (!parsed.success) return erro('Dados extraídos inválidos — seletores desatualizados?');
        if (parsed.data.cnpj && parsed.data.cnpj !== cnpj) {
          return erro(`CNPJ da página (${parsed.data.cnpj}) difere do consultado (${cnpj}).`);
        }

        return { providerId: meta.id, ok: true, data: parsed.data as SicafData, fetchedAt };
      } finally {
        void cr.tabs.remove(tabId).catch(() => undefined);
      }
    },
  };
}
