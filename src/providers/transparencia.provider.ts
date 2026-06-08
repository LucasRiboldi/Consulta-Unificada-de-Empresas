import { z } from 'zod';
import { normalizeCnpj } from '@/shared/utils/cnpj';
import { normalizeCpf } from '@/shared/utils/cpf';
import type {
  ConsultaContext,
  ConsultaProvider,
  ProviderResult,
  SujeitoSuportado,
} from './provider.types';

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';
const AUTH_HEADER = 'chave-api-dados';

/** Item de sanção (CEIS/CNEP). Campos escalares conhecidos do CeisDTO/CnepDTO;
 *  estruturas aninhadas (tipoSancao, orgaoSancionador) ficam soltas para display. */
const RegistroSchema = z
  .object({
    dataInicioSancao: z.string().nullable().default(null),
    dataFimSancao: z.string().nullable().default(null),
    textoPublicacao: z.string().nullable().default(null),
    linkPublicacao: z.string().nullable().default(null),
  })
  .passthrough();

const ListSchema = z.array(RegistroSchema);

export interface RegistroSancao {
  readonly dataInicioSancao: string | null;
  readonly dataFimSancao: string | null;
  readonly textoPublicacao: string | null;
  readonly linkPublicacao: string | null;
  readonly [extra: string]: unknown;
}

export interface TransparenciaData {
  readonly codigoConsultado: string;
  readonly temSancao: boolean;
  readonly ceis: readonly RegistroSancao[];
  readonly cnep: readonly RegistroSancao[];
}

interface Deps {
  readonly fetch?: typeof fetch;
}

export function createTransparenciaProvider(deps: Deps = {}): ConsultaProvider<TransparenciaData> {
  const doFetch = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const suporta: readonly SujeitoSuportado[] = ['pf', 'pj'];

  const meta = {
    id: 'transparencia' as const,
    label: 'Portal da Transparência — CEIS/CNEP (por CPF ou CNPJ)',
    access: 'user-key' as const,
    host: BASE_URL,
    keySignupUrl: 'https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email',
    enabled: true,
  };

  function codigo(ctx: ConsultaContext): string {
    return ctx.sujeito.tipo === 'pf'
      ? normalizeCpf(ctx.sujeito.cpf)
      : normalizeCnpj(ctx.sujeito.cnpj);
  }

  async function buscar(
    cadastro: 'ceis' | 'cnep',
    cod: string,
    key: string,
    signal: AbortSignal | undefined,
  ): Promise<readonly RegistroSancao[]> {
    const url = `${BASE_URL}/${cadastro}?codigoSancionado=${cod}&pagina=1`;
    const init: RequestInit = { headers: { [AUTH_HEADER]: key } };
    if (signal) init.signal = signal;

    const res = await doFetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status} (${cadastro})`);

    const parsed = ListSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`Resposta inválida (${cadastro})`);
    return parsed.data as readonly RegistroSancao[];
  }

  return {
    meta,
    suporta,

    isReady(ctx: ConsultaContext): boolean {
      return meta.enabled && Boolean(ctx.userKeys.transparencia);
    },

    async consultar(ctx: ConsultaContext): Promise<ProviderResult<TransparenciaData>> {
      const fetchedAt = new Date().toISOString();
      const key = ctx.userKeys.transparencia;
      if (!key) {
        return {
          providerId: meta.id,
          ok: false,
          error: 'Chave da API do Portal da Transparência não configurada.',
          fetchedAt,
        };
      }

      const cod = codigo(ctx);
      try {
        const [ceis, cnep] = await Promise.all([
          buscar('ceis', cod, key, ctx.signal),
          buscar('cnep', cod, key, ctx.signal),
        ]);

        const data: TransparenciaData = {
          codigoConsultado: cod,
          temSancao: ceis.length > 0 || cnep.length > 0,
          ceis,
          cnep,
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
