import { maskCpf } from '@/shared/utils/mask';
import type { ResultadoConsulta } from '@/services/consulta.service';

export type FonteStatus = 'ok' | 'erro' | 'pendencia' | 'limpo' | 'na';

export interface FonteView {
  readonly id: string;
  readonly nome: string;
  readonly status: FonteStatus;
}

export interface ConsultaView {
  readonly titulo: string;
  readonly cnpj: string;
  readonly situacao: 'pendencia' | 'limpo';
  readonly situacaoLabel: string;
  readonly fontes: readonly FonteView[];
  readonly socio: {
    readonly nome: string | null;
    readonly cpfMascarado: string | null;
    readonly confirmar: boolean;
  } | null;
  readonly alertas: readonly string[];
}

export function buildConsultaView(r: ResultadoConsulta): ConsultaView {
  const razao = r.cadastro.ok ? r.cadastro.data?.razaoSocial : undefined;

  const tcuStatus: FonteStatus = r.sancoesEmpresa.ok
    ? r.sancoesEmpresa.data?.temPendencia
      ? 'pendencia'
      : 'limpo'
    : 'erro';

  const socioRes = r.socioMajoritario.sancoesSocio;
  const transpStatus: FonteStatus =
    socioRes === null
      ? 'na'
      : socioRes.ok
        ? socioRes.data?.temSancao
          ? 'pendencia'
          : 'limpo'
        : 'erro';

  const candidato = r.socioMajoritario.selecao.candidato;
  const cpf = r.socioMajoritario.cpfInformado;

  return {
    titulo: razao ?? r.cnpjConsultado,
    cnpj: r.cnpjConsultado,
    situacao: r.temPendencia ? 'pendencia' : 'limpo',
    situacaoLabel: r.temPendencia ? 'Pendência encontrada' : 'Sem pendências',
    fontes: [
      { id: 'brasilapi', nome: 'Receita (BrasilAPI)', status: r.cadastro.ok ? 'ok' : 'erro' },
      { id: 'tcu-consolidada', nome: 'TCU Consolidada (CEIS/CNEP/TCU/CNJ)', status: tcuStatus },
      { id: 'transparencia', nome: 'Transparência — sócio (CPF)', status: transpStatus },
    ],
    socio:
      candidato || cpf
        ? {
            nome: candidato?.nome ?? null,
            cpfMascarado: cpf ? maskCpf(cpf) : null,
            confirmar: r.socioMajoritario.selecao.requerConfirmacaoManual,
          }
        : null,
    alertas: r.alertas,
  };
}
