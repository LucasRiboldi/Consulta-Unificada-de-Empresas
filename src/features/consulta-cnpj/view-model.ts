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

  const statusSancao = (
    res: { ok: boolean; data?: { temSancao?: boolean } } | null | undefined,
  ): FonteStatus =>
    res === null || res === undefined
      ? 'na'
      : res.ok
        ? res.data?.temSancao
          ? 'pendencia'
          : 'limpo'
        : 'erro';

  const socioRes = r.socioMajoritario.sancoesSocio;
  const transpStatus = statusSancao(socioRes);
  const transpEmpresaStatus = statusSancao(r.sancoesEmpresaTransparencia);

  const pendSicaf = r.socioMajoritario.pendenciaSicaf;
  const sicafSocioStatus: FonteStatus =
    pendSicaf === null || pendSicaf === undefined ? 'na' : pendSicaf ? 'pendencia' : 'limpo';

  const candidato = r.socioMajoritario.selecao.candidato;
  const cpf = r.socioMajoritario.cpfInformado;

  return {
    titulo: razao ?? r.cnpjConsultado,
    cnpj: r.cnpjConsultado,
    situacao: r.temPendencia ? 'pendencia' : 'limpo',
    situacaoLabel: r.temPendencia ? 'Pendência encontrada' : 'Sem pendências',
    fontes: [
      { id: 'brasilapi', nome: 'Receita (BrasilAPI)', status: r.cadastro.ok ? 'ok' : 'erro' },
      { id: 'tcu-consolidada', nome: 'Empresa — TCU (CEIS/CNEP/TCU/CNJ)', status: tcuStatus },
      {
        id: 'transparencia-empresa',
        nome: 'Empresa — CEIS/CNEP (Transparência)',
        status: transpEmpresaStatus,
      },
      {
        id: 'transparencia-socio',
        nome: 'Sócio — CEIS/CNEP (Transparência)',
        status: transpStatus,
      },
      { id: 'sicaf-socio', nome: 'Sócio — pendência (SICAF)', status: sicafSocioStatus },
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
