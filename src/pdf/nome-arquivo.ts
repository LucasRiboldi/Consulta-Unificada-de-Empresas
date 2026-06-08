import { sanitizeFilename } from '@/security/sanitize';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Timestamp local no formato YYYY-MM-DD_HH-MM. */
export function formatStamp(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}`
  );
}

/** Nome do relatório: RAZAO_SOCIAL_YYYY-MM-DD_HH-MM.pdf (sanitizado). */
export function buildNomeArquivo(razaoSocial: string, date: Date = new Date()): string {
  return `${sanitizeFilename(razaoSocial)}_${formatStamp(date)}.pdf`;
}
