import { describe, test, expect } from 'vitest';
import { selecionarSocioMajoritario } from '@/services/socio-majoritario';
import type { Socio } from '@/shared/types/socio';

const socio = (nome: string, qualificacao: string): Socio => ({
  nome,
  qualificacao,
  cpfMascarado: '***000000**',
  dataEntradaSociedade: null,
});

describe('selecionarSocioMajoritario', () => {
  test('sem sócios (ex.: S.A. de capital aberto) → nenhum candidato', () => {
    const r = selecionarSocioMajoritario([]);
    expect(r.candidato).toBeNull();
    expect(r.confianca).toBe('nenhuma');
    expect(r.requerConfirmacaoManual).toBe(false);
  });

  test('sócio único → candidato com confiança alta, sem confirmação manual', () => {
    const s = socio('FULANO', 'Sócio');
    const r = selecionarSocioMajoritario([s]);
    expect(r.candidato).toBe(s);
    expect(r.confianca).toBe('alta');
    expect(r.requerConfirmacaoManual).toBe(false);
  });

  test('múltiplos sócios → exige confirmação manual (percentual indisponível)', () => {
    const r = selecionarSocioMajoritario([socio('A', 'Diretor'), socio('B', 'Diretor')]);
    expect(r.requerConfirmacaoManual).toBe(true);
    expect(r.confianca).toBe('baixa');
  });

  test('múltiplos sócios → propõe o de qualificação administrativa de maior prioridade', () => {
    const adm = socio('B', 'Sócio-Administrador');
    const r = selecionarSocioMajoritario([socio('A', 'Diretor'), adm, socio('C', 'Presidente')]);
    expect(r.candidato).toBe(adm);
  });
});
