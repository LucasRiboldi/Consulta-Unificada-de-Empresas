import type { Socio, SelecaoSocioMajoritario } from '@/shared/types/socio';

/** Ordem de prioridade para propor um candidato quando há mais de um sócio.
 *  NÃO indica participação societária (a BrasilAPI não expõe percentual) — é só
 *  uma pista para o usuário, que deve confirmar manualmente (R-E). */
const PRIORIDADE_QUALIFICACAO = [
  'sócio-administrador',
  'administrador',
  'sócio',
  'presidente',
  'diretor',
];

function rank(qualificacao: string): number {
  const q = qualificacao.toLowerCase();
  const i = PRIORIDADE_QUALIFICACAO.findIndex((p) => q.includes(p));
  return i === -1 ? PRIORIDADE_QUALIFICACAO.length : i;
}

export function selecionarSocioMajoritario(socios: readonly Socio[]): SelecaoSocioMajoritario {
  if (socios.length === 0) {
    return {
      candidato: null,
      requerConfirmacaoManual: false,
      confianca: 'nenhuma',
      motivo: 'Sem quadro societário (ex.: sociedade anônima de capital aberto).',
    };
  }

  if (socios.length === 1) {
    return {
      candidato: socios[0]!,
      requerConfirmacaoManual: false,
      confianca: 'alta',
      motivo: 'Sócio único no quadro societário.',
    };
  }

  const candidato = [...socios].sort((a, b) => rank(a.qualificacao) - rank(b.qualificacao))[0]!;
  return {
    candidato,
    requerConfirmacaoManual: true,
    confianca: 'baixa',
    motivo:
      'Percentual de participação não é exposto pela fonte. Confirme o sócio majoritário manualmente.',
  };
}
