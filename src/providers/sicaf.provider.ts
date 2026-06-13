import { z } from 'zod';
import type {
  ConsultaContext,
  ConsultaProvider,
  ProviderResult,
  SujeitoSuportado,
} from './provider.types';

const SICAF_HOST = 'https://*.comprasnet.gov.br/*';

/** Timeout para resposta do content script (ms). */
const TIMEOUT_MS = 8_000;

const SocioSchema = z.object({
  nome: z.string(),
  cpf: z.string().length(11),
  qualificacao: z.string().nullable(),
  dataEntradaSociedade: z.string().nullable(),
});

const SicafExtraidoSchema = z.object({
  cnpj: z.string().length(14),
  razaoSocial: z.string(),
  nomeFantasia: z.string().nullable(),
  uf: z.string().nullable(),
  habilitado: z.boolean(),
  statusHabilitacao: z.string().nullable(),
  socios: z.array(SocioSchema),
  seletoresVersao: z.string(),
});

export interface SicafData {
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeFantasia: string | null;
  readonly uf: string | null;
  readonly habilitado: boolean;
  readonly statusHabilitacao: string | null;
  /** Sócios com CPF completo — diferencial do SICAF vs BrasilAPI. */
  readonly socios: readonly {
    readonly nome: string;
    readonly cpf: string;
    readonly qualificacao: string | null;
    readonly dataEntradaSociedade: string | null;
  }[];
  readonly seletoresVersao: string;
}

interface Deps {
  /** Injete chrome para testes. */
  readonly chrome?: typeof globalThis.chrome;
}

export function createSicafProvider(deps: Deps = {}): ConsultaProvider<SicafData> {
  const cr = deps.chrome ?? globalThis.chrome;
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

      if (ctx.sujeito.tipo !== 'pj') {
        return { providerId: meta.id, ok: false, error: 'Fonte aceita apenas PJ.', fetchedAt };
      }

      const cnpj = ctx.sujeito.cnpj.replace(/\D/g, '');

      // Localiza aba aberta em comprasnet.gov.br
      let tabs: chrome.tabs.Tab[];
      try {
        tabs = await cr.tabs.query({ url: SICAF_HOST });
      } catch {
        return {
          providerId: meta.id,
          ok: false,
          error: 'Permissão de host não concedida. Ative o SICAF nas opções.',
          fetchedAt,
        };
      }

      if (tabs.length === 0) {
        return {
          providerId: meta.id,
          ok: false,
          error: 'Nenhuma aba do Comprasnet encontrada. Abra e faça login no SICAF.',
          fetchedAt,
        };
      }

      const tabId = tabs[0]!.id;
      if (tabId === undefined) {
        return { providerId: meta.id, ok: false, error: 'ID de aba inválido.', fetchedAt };
      }

      // Envia pedido ao content script com timeout
      const response = await Promise.race([
        cr.tabs.sendMessage(tabId, { type: 'EXTRACT_SICAF_DATA', cnpj }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
      ]);

      if (response === null) {
        return {
          providerId: meta.id,
          ok: false,
          error: `Tempo esgotado (${TIMEOUT_MS / 1000}s). Certifique-se de estar na página do fornecedor no SICAF.`,
          fetchedAt,
        };
      }

      const res = response as { ok: boolean; data?: unknown; error?: string };
      if (!res.ok) {
        return {
          providerId: meta.id,
          ok: false,
          error: res.error ?? 'Erro no content script.',
          fetchedAt,
        };
      }

      const parsed = SicafExtraidoSchema.safeParse(res.data);
      if (!parsed.success) {
        return {
          providerId: meta.id,
          ok: false,
          error: 'Dados extraídos inválidos — seletores desatualizados?',
          fetchedAt,
        };
      }

      const raw = parsed.data;

      // Valida que o CNPJ da página bate com o consultado
      if (raw.cnpj !== cnpj) {
        return {
          providerId: meta.id,
          ok: false,
          error: `CNPJ da página (${raw.cnpj}) difere do consultado (${cnpj}). Navegue até a página correta.`,
          fetchedAt,
        };
      }

      return { providerId: meta.id, ok: true, data: raw as SicafData, fetchedAt };
    },
  };
}
