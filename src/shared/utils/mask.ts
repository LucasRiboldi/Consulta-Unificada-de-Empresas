import { normalizeCpf } from './cpf';

/** Mascara um CPF para exibição/armazenamento, preservando só os 6 dígitos centrais.
 *  Ex.: 11144477735 → ***.444.777-**. Entrada sem 11 dígitos → "***" (sem vazar nada). */
export function maskCpf(input: string): string {
  const d = normalizeCpf(input);
  if (d.length !== 11) return '***';
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}
