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
  /** Sanções da empresa: Consolidada do TCU (CEIS/CNEP/TCU/CNJ, keyless). */
  readonly sancoesEmpresa: ProviderResult<TcuConsolidadaData>;
  /** Sanções da empresa no Portal da Transparência (CEIS/CNEP detalhado, com chave). */
  readonly sancoesEmpresaTransparencia: ProviderResult<TransparenciaData> | null;
  readonly socioMajoritario: {
    readonly selecao: SelecaoSocioMajoritario;
    readonly cpfInformado: string | null;
    readonly sancoesSocio: ProviderResult<TransparenciaData> | null;
    /** Flag "Possui pendência" do SICAF para o sócio majoritário (keyless). */
    readonly pendenciaSicaf: boolean | null;
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

/** Sócio de maior participação no SICAF (ignora administradores sem % e sócios PJ). */
function socioMajoritarioSicaf(socios: readonly SicafSocio[]): SicafSocio | undefined {
  const elegiveis = socios.filter(
    (s) => s.tipoDocumento === 'cpf' && s.participacaoSocietaria !== null,
  );
  if (elegiveis.length === 0) return undefined;
  return elegiveis.reduce((a, s) =>
    (s.participacaoSocietaria ?? 0) > (a.participacaoSocietaria ?? 0) ? s : a,
  );
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

      // Empresa: cadastro + sanções (TCU) + SICAF + CEIS/CNEP no Transparência (paralelo).
      const sicafReady = deps.sicaf.isReady(ctxPj);
      const transpEmpresaReady = deps.transparencia.isReady(ctxPj); // exige chave BYOK
      const [cadastro, sancoesEmpresa, sicafResult, sancoesEmpresaTransparencia] =
        await Promise.all([
          deps.brasilapi.consultar(ctxPj),
          deps.tcu.consultar(ctxPj),
          sicafReady ? deps.sicaf.consultar(ctxPj) : Promise.resolve(null),
          transpEmpresaReady ? deps.transparencia.consultar(ctxPj) : Promise.resolve(null),
        ]);

      const alertas: string[] = [];

      const socios = cadastro.ok && cadastro.data ? cadastro.data.socios : [];
      if (!cadastro.ok) alertas.push('Não foi possível obter o cadastro da empresa.');

      const selecao = selecionarSocioMajoritario(socios);
      if (selecao.requerConfirmacaoManual) {
        alertas.push('Confirme o sócio majoritário manualmente (percentual não disponível).');
      }

      // Sócio majoritário do SICAF (se houver) — fonte do CPF e da pendência keyless.
      const socioSicaf =
        sicafResult?.ok && sicafResult.data
          ? socioMajoritarioSicaf(sicafResult.data.socios)
          : undefined;

      // CPF do sócio majoritário (art. 12): manual tem prioridade; senão, do SICAF.
      let cpfMajoritario = input.socioMajoritarioCpf;
      let origemCpf: 'manual' | 'sicaf' | null = cpfMajoritario !== undefined ? 'manual' : null;

      if (cpfMajoritario === undefined && socioSicaf) {
        cpfMajoritario = socioSicaf.documento;
        origemCpf = 'sicaf';
      }

      // Pendência do sócio majoritário pelo SICAF (keyless), independente da chave BYOK.
      const pendenciaSicaf = socioSicaf?.possuiPendencia ?? null;
      if (pendenciaSicaf === true) {
        alertas.push('SICAF indica que o sócio majoritário possui pendência.');
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
      const pendenciaEmpresaTransp =
        sancoesEmpresaTransparencia?.ok === true &&
        sancoesEmpresaTransparencia.data?.temSancao === true;
      const pendenciaSocio = sancoesSocio?.ok === true && sancoesSocio.data?.temSancao === true;
      const naoHabilitadoSicaf = sicafResult?.ok === true && sicafResult.data?.habilitado === false;

      if (sicafResult !== null && !sicafResult.ok) {
        alertas.push(`SICAF: ${sicafResult.error ?? 'Erro na consulta.'}`);
      }
      if (pendenciaEmpresaTransp) {
        alertas.push('Empresa com registro no CEIS/CNEP (Portal da Transparência).');
      }

      return {
        cnpjConsultado: cnpj,
        geradoEm: new Date().toISOString(),
        cadastro,
        sancoesEmpresa,
        sancoesEmpresaTransparencia,
        socioMajoritario: { selecao, cpfInformado, sancoesSocio, pendenciaSicaf },
        sicaf: sicafResult,
        temPendencia: Boolean(
          pendenciaEmpresa ||
          pendenciaEmpresaTransp ||
          pendenciaSocio ||
          pendenciaSicaf === true ||
          naoHabilitadoSicaf,
        ),
        alertas,
      };
    },
  };
}

export type ConsultaService = ReturnType<typeof createConsultaService>;
