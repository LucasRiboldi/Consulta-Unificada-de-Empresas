import { isValidCnpj, normalizeCnpj } from '@/shared/utils/cnpj';
import { isValidCpf, normalizeCpf } from '@/shared/utils/cpf';
import { selecionarSocioMajoritario } from '@/services/socio-majoritario';
import type { ConsultaProvider, ProviderResult } from '@/providers/provider.types';
import type { BrasilApiData } from '@/providers/brasilapi.provider';
import type { TcuConsolidadaData } from '@/providers/tcu-consolidada.provider';
import type { TransparenciaData } from '@/providers/transparencia.provider';
import type { SicafData, SicafSocio } from '@/providers/sicaf.provider';
import type { SelecaoSocioMajoritario } from '@/shared/types/socio';
import type { ProviderId } from '@/providers/provider.types';

export interface ConsultaInput {
  readonly cnpj: string;
  readonly userKeys: Partial<Record<ProviderId, string>>;
  /** CPF completo do sócio majoritário (de entrada manual ou do SICAF). */
  readonly socioMajoritarioCpf?: string;
  readonly signal?: AbortSignal;
}

export interface ResultadoConsulta {
  readonly cnpjConsultado: string;
  readonly geradoEm: string;
  readonly cadastro: ProviderResult<BrasilApiData>;
  readonly sancoesEmpresa: ProviderResult<TcuConsolidadaData>;
  readonly socioMajoritario: {
    readonly selecao: SelecaoSocioMajoritario;
    readonly cpfInformado: string | null;
    readonly sancoesSocio: ProviderResult<TransparenciaData> | null;
  };
  /** Habilitação e sócios do SICAF (null se provider desabilitado ou não pronto). */
  readonly sicaf: ProviderResult<SicafData> | null;
  readonly temPendencia: boolean;
  readonly alertas: readonly string[];
}

export interface ConsultaServiceDeps {
  readonly brasilapi: ConsultaProvider<BrasilApiData>;
  readonly tcu: ConsultaProvider<TcuConsolidadaData>;
  readonly transparencia: ConsultaProvider<TransparenciaData>;
  readonly sicaf: ConsultaProvider<SicafData>;
}

/** CPF do sócio de maior participação no SICAF (ignora administradores sem % e sócios PJ). */
function cpfMajoritarioDoSicaf(socios: readonly SicafSocio[]): string | undefined {
  const elegiveis = socios.filter(
    (s) => s.tipoDocumento === 'cpf' && s.participacaoSocietaria !== null,
  );
  if (elegiveis.length === 0) return undefined;
  const maior = elegiveis.reduce((a, s) =>
    (s.participacaoSocietaria ?? 0) > (a.participacaoSocietaria ?? 0) ? s : a,
  );
  return maior.documento;
}

export function createConsultaService(deps: ConsultaServiceDeps) {
  return {
    async consultar(input: ConsultaInput): Promise<ResultadoConsulta> {
      const cnpj = normalizeCnpj(input.cnpj);
      if (!isValidCnpj(cnpj)) {
        throw new Error('CNPJ inválido.');
      }

      const baseCtx = {
        userKeys: input.userKeys,
        ...(input.signal ? { signal: input.signal } : {}),
      };
      const ctxPj = { ...baseCtx, sujeito: { tipo: 'pj' as const, cnpj } };

      // Empresa: cadastro + sanções + SICAF (paralelo quando prontos).
      const sicafReady = deps.sicaf.isReady(ctxPj);
      const [cadastro, sancoesEmpresa, sicafResult] = await Promise.all([
        deps.brasilapi.consultar(ctxPj),
        deps.tcu.consultar(ctxPj),
        sicafReady ? deps.sicaf.consultar(ctxPj) : Promise.resolve(null),
      ]);

      const alertas: string[] = [];

      const socios = cadastro.ok && cadastro.data ? cadastro.data.socios : [];
      if (!cadastro.ok) alertas.push('Não foi possível obter o cadastro da empresa.');

      const selecao = selecionarSocioMajoritario(socios);
      if (selecao.requerConfirmacaoManual) {
        alertas.push('Confirme o sócio majoritário manualmente (percentual não disponível).');
      }

      // Sócio majoritário (art. 12): CPF manual tem prioridade; senão, identificado
      // automaticamente pelo SICAF (maior participação societária).
      let cpfMajoritario = input.socioMajoritarioCpf;
      let origemCpf: 'manual' | 'sicaf' | null = cpfMajoritario !== undefined ? 'manual' : null;

      if (cpfMajoritario === undefined && sicafResult?.ok && sicafResult.data) {
        const auto = cpfMajoritarioDoSicaf(sicafResult.data.socios);
        if (auto !== undefined) {
          cpfMajoritario = auto;
          origemCpf = 'sicaf';
        }
      }

      let cpfInformado: string | null = null;
      let sancoesSocio: ProviderResult<TransparenciaData> | null = null;

      if (cpfMajoritario === undefined) {
        alertas.push('CPF do sócio majoritário não informado — consulta do art. 12 incompleta.');
      } else if (!isValidCpf(cpfMajoritario)) {
        alertas.push('CPF do sócio majoritário inválido — consulta do art. 12 não realizada.');
      } else {
        cpfInformado = normalizeCpf(cpfMajoritario);
        if (origemCpf === 'sicaf') {
          alertas.push(
            'Sócio majoritário identificado automaticamente pelo SICAF (maior participação).',
          );
        }
        const ctxPf = { ...baseCtx, sujeito: { tipo: 'pf' as const, cpf: cpfInformado } };
        sancoesSocio = await deps.transparencia.consultar(ctxPf);
        if (!sancoesSocio.ok) {
          alertas.push('Não foi possível consultar o sócio (verifique a chave da API).');
        }
      }

      const pendenciaEmpresa = sancoesEmpresa.ok && sancoesEmpresa.data?.temPendencia === true;
      const pendenciaSocio = sancoesSocio?.ok === true && sancoesSocio.data?.temSancao === true;
      const naoHabilitadoSicaf = sicafResult?.ok === true && sicafResult.data?.habilitado === false;

      if (sicafResult !== null && !sicafResult.ok) {
        alertas.push(`SICAF: ${sicafResult.error ?? 'Erro na consulta.'}`);
      }

      return {
        cnpjConsultado: cnpj,
        geradoEm: new Date().toISOString(),
        cadastro,
        sancoesEmpresa,
        socioMajoritario: { selecao, cpfInformado, sancoesSocio },
        sicaf: sicafResult,
        temPendencia: Boolean(pendenciaEmpresa || pendenciaSocio || naoHabilitadoSicaf),
        alertas,
      };
    },
  };
}

export type ConsultaService = ReturnType<typeof createConsultaService>;
