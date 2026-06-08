import { describe, test, expect } from 'vitest';
import { buildNomeArquivo } from '@/pdf/nome-arquivo';

describe('buildNomeArquivo', () => {
  const d = new Date(2026, 5, 8, 14, 5); // 08/06/2026 14:05 (local)
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;

  test('formata RAZAO_SOCIAL_YYYY-MM-DD_HH-MM.pdf', () => {
    expect(buildNomeArquivo('Magazine Luiza S/A', d)).toBe(`MAGAZINE_LUIZA_S_A_${stamp}.pdf`);
  });

  test('sanitiza nome perigoso e mantém o padrão de data', () => {
    const nome = buildNomeArquivo('../../etc/passwd', d);
    expect(nome).not.toContain('..');
    expect(nome).not.toContain('/');
    expect(nome).toMatch(/^[A-Z0-9_]+_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/);
  });
});
