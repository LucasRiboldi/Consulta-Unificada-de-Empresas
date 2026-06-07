import { z } from 'zod';
import { normalizeCnpj } from '@/shared/utils/cnpj';
import type {
  ConsultaContext,
  ConsultaProvider,
  ProviderResult,
  SujeitoSuportado,
} from './provider.types';

const BASE_URL = 'https://certidoes-apf.apps.tcu.gov.br/api/rest/publico/certidoes';
const NADA_CONSTA = 'NADA_CONSTA';

/** Schema da resposta bruta da Consulta Consolidada (validação de boundary — T-07). */
const CertidaoSchema = z.object({
  tipo: z.string(),
  emissor: z.string(),
  descricao: z.string(),
  situacao: z.string(),
  linkConsultaManual: z.string().nullable().default(null),
  observacao: z.string().nullable().default(null),
});

const RawSchema = z.object({
  cnpj: z.string(),
  razaoSocial: z.string(),
  nomeFantasia: z.string().nullable().default(null),
  uf: z.string().nullable().default(null),
  seCnpjEncontradoNaBaseTcu: z.boolean(),
  certidaoPDF: z.string().nullable().default(null),
  certidoes: z.array(CertidaoSchema),
});

export interface CertidaoConsolidada {
  readonly tipo: string;
  readonly emissor: string;
  readonly descricao: string;
  readonly situacao: string;
  readonly linkConsultaManual: string | null;
  readonly observacao: string | null;
}

export interface TcuConsolidadaData {
  readonly razaoSocial: string;
  readonly nomeFantasia: string | null;
  readonly cnpj: string;
  readonly uf: string | null;
  readonly encontradoNaBaseTcu: boolean;
  readonly certidoes: readonly CertidaoConsolidada[];
  /** true se qualquer certidão tiver situação diferente de NADA_CONSTA. */
  readonly temPendencia: boolean;
  readonly certidaoPdfBase64: string | null;
}

interface Deps {
  readonly fetch?: typeof fetch;
}

export function createTcuConsolidadaProvider(
  deps: Deps = {},
): ConsultaProvider<TcuConsolidadaData> {
  const doFetch = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const suporta: readonly SujeitoSuportado[] = ['pj'];

  const meta = {
    id: 'tcu-consolidada' as const,
    label: 'TCU — Consulta Consolidada (CEIS, CNEP, TCU, CNJ)',
    access: 'public-fetch' as const,
    host: BASE_URL,
    enabled: true,
  };

  return {
    meta,
    suporta,

    isReady(ctx: ConsultaContext): boolean {
      return meta.enabled && ctx.sujeito.tipo === 'pj';
    },

    async consultar(ctx: ConsultaContext): Promise<ProviderResult<TcuConsolidadaData>> {
      const fetchedAt = new Date().toISOString();
      if (ctx.sujeito.tipo !== 'pj') {
        return { providerId: meta.id, ok: false, error: 'Fonte aceita apenas PJ.', fetchedAt };
      }

      const cnpj = normalizeCnpj(ctx.sujeito.cnpj);
      const init: RequestInit = ctx.signal ? { signal: ctx.signal } : {};

      try {
        const res = await doFetch(`${BASE_URL}/${cnpj}`, init);
        if (!res.ok) {
          return { providerId: meta.id, ok: false, error: `HTTP ${res.status}`, fetchedAt };
        }

        const parsed = RawSchema.safeParse(await res.json());
        if (!parsed.success) {
          return { providerId: meta.id, ok: false, error: 'Resposta inválida da fonte.', fetchedAt };
        }

        const raw = parsed.data;
        const certidoes: CertidaoConsolidada[] = raw.certidoes.map((c) => ({
          tipo: c.tipo,
          emissor: c.emissor,
          descricao: c.descricao,
          situacao: c.situacao,
          linkConsultaManual: c.linkConsultaManual,
          observacao: c.observacao,
        }));

        const data: TcuConsolidadaData = {
          razaoSocial: raw.razaoSocial,
          nomeFantasia: raw.nomeFantasia,
          cnpj: raw.cnpj,
          uf: raw.uf,
          encontradoNaBaseTcu: raw.seCnpjEncontradoNaBaseTcu,
          certidoes,
          temPendencia: certidoes.some((c) => c.situacao !== NADA_CONSTA),
          certidaoPdfBase64: raw.certidaoPDF,
        };

        return { providerId: meta.id, ok: true, data, fetchedAt };
      } catch (e) {
        return {
          providerId: meta.id,
          ok: false,
          error: e instanceof Error ? e.message : 'Erro de rede.',
          fetchedAt,
        };
      }
    },
  };
}
