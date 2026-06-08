/** Sócio do QSA. A BrasilAPI sempre mascara o CPF (`***571038**`); o CPF completo,
 *  necessário para a consulta do art. 12, só é obtido na tela autenticada do SICAF. */
export interface Socio {
  readonly nome: string;
  readonly cpfMascarado: string;
  readonly qualificacao: string;
  readonly dataEntradaSociedade: string | null;
}

/** Resultado da heurística de identificação do sócio majoritário (ver R-E). */
export interface SelecaoSocioMajoritario {
  readonly candidato: Socio | null;
  /** true quando o sistema não pode determinar com segurança (mais de um sócio). */
  readonly requerConfirmacaoManual: boolean;
  readonly confianca: 'alta' | 'baixa' | 'nenhuma';
  readonly motivo: string;
}
