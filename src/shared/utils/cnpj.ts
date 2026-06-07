/** Remove máscara, mantendo apenas dígitos. */
export function normalizeCnpj(input: string): string {
  return input.replace(/\D/g, '');
}

function checkDigit(digits: string, weights: readonly number[]): number {
  const sum = weights.reduce((acc, weight, i) => acc + Number(digits[i]) * weight, 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

const DV1_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const DV2_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/** Valida um CNPJ (com ou sem máscara) pelos dígitos verificadores (módulo 11). */
export function isValidCnpj(input: string): boolean {
  const cnpj = normalizeCnpj(input);
  if (cnpj.length !== 14) return false;
  // Sequências de dígitos repetidos passam no checksum, mas são inválidas.
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const dv1 = checkDigit(cnpj.slice(0, 12), DV1_WEIGHTS);
  const dv2 = checkDigit(cnpj.slice(0, 13), DV2_WEIGHTS);
  return dv1 === Number(cnpj[12]) && dv2 === Number(cnpj[13]);
}
