import { z } from 'zod';
import { normalizeCnpj } from '@/shared/utils/cnpj';
import type { Socio } from '@/shared/types/socio';
import type {
  ConsultaContext,
  ConsultaProvider,
  ProviderResult,
  SujeitoSuportado,
} from './provider.types';

const BASE_URL = 'https://brasilapi.com.br/api/cnpj/v1';

/** Schema da resposta da BrasilAPI (boundary — T-07). Campos não usados são ignorados. */
const SocioSchema = z.object({
  nome_socio: z.string(),
  cnpj_cpf_do_socio: z.string().nullable().default(null),
  qualificacao_socio: z.string().nullable().default(null),
  data_entrada_sociedade: z.string().nullable().default(null),
});

const RawSchema = z.object({
  cnpj: z.string(),
  razao_social: z.string(),
  nome_fantasia: z.string().nullable().default(null),
  uf: z.string().nullable().default(null),
  capital_social: z.number().nullable().default(null),
  porte: z.string().nullable().default(null),
  natureza_juridica: z.string().nullable().default(null),
  qsa: z.array(SocioSchema).default([]),
});

export interface BrasilApiData {
  readonly razaoSocial: string;
  readonly nomeFantasia: string | null;
  readonly cnpj: string;
  readonly uf: string | null;
  readonly capitalSocial: number | null;
  readonly porte: string | null;
  readonly naturezaJuridica: string | null;
  /** Sócios do QSA. CPF sempre mascarado pela fonte. */
  readonly socios: readonly Socio[];
}

interface Deps {
  readonly fetch?: typeof fetch;
}

export function createBrasilApiProvider(deps: Deps = {}): ConsultaProvider<BrasilApiData> {
  const doFetch = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const suporta: readonly SujeitoSuportado[] = ['pj'];

  const meta = {
    id: 'brasilapi' as const,
    label: 'Receita Federal (CNPJ + QSA) via BrasilAPI',
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

    async consultar(ctx: ConsultaContext): Promise<ProviderResult<BrasilApiData>> {
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
          return {
            providerId: meta.id,
            ok: false,
            error: 'Resposta inválida da fonte.',
            fetchedAt,
          };
        }

        const raw = parsed.data;
        const socios: Socio[] = raw.qsa.map((s) => ({
          nome: s.nome_socio,
          cpfMascarado: s.cnpj_cpf_do_socio ?? '',
          qualificacao: s.qualificacao_socio ?? '',
          dataEntradaSociedade: s.data_entrada_sociedade,
        }));

        const data: BrasilApiData = {
          razaoSocial: raw.razao_social,
          nomeFantasia: raw.nome_fantasia,
          cnpj: raw.cnpj,
          uf: raw.uf,
          capitalSocial: raw.capital_social,
          porte: raw.porte,
          naturezaJuridica: raw.natureza_juridica,
          socios,
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
