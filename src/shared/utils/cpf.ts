/** Remove máscara, mantendo apenas dígitos. */
export function normalizeCpf(input: string): string {
  return input.replace(/\D/g, '');
}

function checkDigit(digits: string, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += Number(digits[i]) * (length + 1 - i);
  }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/** Valida um CPF (com ou sem máscara) pelos dígitos verificadores (módulo 11). */
export function isValidCpf(input: string): boolean {
  const cpf = normalizeCpf(input);
  if (cpf.length !== 11) return false;
  // Sequências de dígitos repetidos passam no checksum, mas são inválidas.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const dv1 = checkDigit(cpf, 9);
  const dv2 = checkDigit(cpf, 10);
  return dv1 === Number(cpf[9]) && dv2 === Number(cpf[10]);
}
