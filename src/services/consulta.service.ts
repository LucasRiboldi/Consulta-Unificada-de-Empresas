import { isValidCnpj, normalizeCnpj } from '@/shared/utils/cnpj';
import { isValidCpf, normalizeCpf } from '@/shared/utils/cpf';
import { selecionarSocioMajoritario } from '@/services/socio-majoritario';
import type { ConsultaProvider, ProviderResult } from '@/providers/provider.types';
import type { BrasilApiData } from '@/providers/brasilapi.provider';
import type { TcuConsolidadaData } from '@/providers/tcu-consolidada.provider';
import type { TransparenciaData } from '@/providers/transparencia.provider';
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
  readonly temPendencia: boolean;
  readonly alertas: readonly string[];
}

export interface ConsultaServiceDeps {
  readonly brasilapi: ConsultaProvider<BrasilApiData>;
  readonly tcu: ConsultaProvider<TcuConsolidadaData>;
  readonly transparencia: ConsultaProvider<TransparenciaData>;
}

export function createConsultaService(deps: ConsultaServiceDeps) {
  return {
    async consultar(input: ConsultaInput): Promise<ResultadoConsulta> {
      const cnpj = normalizeCnpj(input.cnpj);
      if (!isValidCnpj(cnpj)) {
        throw new Error('CNPJ inválido.');
      }

      const baseCtx = { userKeys: input.userKeys, ...(input.signal ? { signal: input.signal } : {}) };
      const ctxPj = { ...baseCtx, sujeito: { tipo: 'pj' as const, cnpj } };

      // Empresa: cadastro + sanções (paralelo).
      const [cadastro, sancoesEmpresa] = await Promise.all([
        deps.brasilapi.consultar(ctxPj),
        deps.tcu.consultar(ctxPj),
      ]);

      const alertas: string[] = [];

      const socios = cadastro.ok && cadastro.data ? cadastro.data.socios : [];
      if (!cadastro.ok) alertas.push('Não foi possível obter o cadastro da empresa.');

      const selecao = selecionarSocioMajoritario(socios);
      if (selecao.requerConfirmacaoManual) {
        alertas.push('Confirme o sócio majoritário manualmente (percentual não disponível).');
      }

      // Sócio majoritário: consulta de PF (art. 12) somente com CPF válido + chave.
      let cpfInformado: string | null = null;
      let sancoesSocio: ProviderResult<TransparenciaData> | null = null;

      if (input.socioMajoritarioCpf === undefined) {
        alertas.push('CPF do sócio majoritário não informado — consulta do art. 12 incompleta.');
      } else if (!isValidCpf(input.socioMajoritarioCpf)) {
        alertas.push('CPF do sócio majoritário inválido — consulta do art. 12 não realizada.');
      } else {
        cpfInformado = normalizeCpf(input.socioMajoritarioCpf);
        const ctxPf = { ...baseCtx, sujeito: { tipo: 'pf' as const, cpf: cpfInformado } };
        sancoesSocio = await deps.transparencia.consultar(ctxPf);
        if (!sancoesSocio.ok) {
          alertas.push('Não foi possível consultar o sócio (verifique a chave da API).');
        }
      }

      const pendenciaEmpresa = sancoesEmpresa.ok && sancoesEmpresa.data?.temPendencia === true;
      const pendenciaSocio = sancoesSocio?.ok === true && sancoesSocio.data?.temSancao === true;

      return {
        cnpjConsultado: cnpj,
        geradoEm: new Date().toISOString(),
        cadastro,
        sancoesEmpresa,
        socioMajoritario: { selecao, cpfInformado, sancoesSocio },
        temPendencia: Boolean(pendenciaEmpresa || pendenciaSocio),
        alertas,
      };
    },
  };
}

export type ConsultaService = ReturnType<typeof createConsultaService>;
