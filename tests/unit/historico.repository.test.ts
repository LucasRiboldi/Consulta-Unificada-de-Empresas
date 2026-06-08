import 'fake-indexeddb/auto';
import { describe, test, expect } from 'vitest';
import {
  createHistoricoRepository,
  toHistoricoEntry,
  type HistoricoEntry,
} from '@/storage/historico.repository';
import type { ResultadoConsulta } from '@/services/consulta.service';

let dbSeq = 0;
const freshRepo = () => createHistoricoRepository(`test-${Date.now()}-${dbSeq++}`);

const entry = (over: Partial<HistoricoEntry> = {}): HistoricoEntry => ({
  cnpj: '00000000000191',
  razaoSocial: 'EMPRESA X',
  socioMajoritarioNome: 'FULANO',
  socioMajoritarioCpfMascarado: '***.444.777-**',
  temPendencia: false,
  consultadoEm: '2026-06-08T10:00:00.000Z',
  ...over,
});

describe('HistoricoRepository — save & list', () => {
  test('saves an entry and lists it back', async () => {
    const repo = freshRepo();
    await repo.save(entry());
    const all = await repo.list();
    expect(all).toHaveLength(1);
    expect(all[0]?.razaoSocial).toBe('EMPRESA X');
  });

  test('lists most recent first', async () => {
    const repo = freshRepo();
    await repo.save(entry({ razaoSocial: 'ANTIGA', consultadoEm: '2026-01-01T00:00:00.000Z' }));
    await repo.save(entry({ razaoSocial: 'NOVA', consultadoEm: '2026-06-01T00:00:00.000Z' }));
    const all = await repo.list();
    expect(all[0]?.razaoSocial).toBe('NOVA');
  });
});

describe('HistoricoRepository — search', () => {
  test('finds by CNPJ substring and by razão social (case-insensitive)', async () => {
    const repo = freshRepo();
    await repo.save(entry({ cnpj: '11222333000181', razaoSocial: 'PADARIA DO ZE' }));
    await repo.save(entry({ cnpj: '00000000000191', razaoSocial: 'BANCO TAL' }));
    expect(await repo.search('padaria')).toHaveLength(1);
    expect(await repo.search('112223')).toHaveLength(1);
    expect(await repo.search('xyz')).toHaveLength(0);
  });
});

describe('HistoricoRepository — clear & retention', () => {
  test('clear() removes everything', async () => {
    const repo = freshRepo();
    await repo.save(entry());
    await repo.clear();
    expect(await repo.list()).toHaveLength(0);
  });

  test('pruneOlderThan deletes entries before the cutoff and returns the count', async () => {
    const repo = freshRepo();
    await repo.save(entry({ consultadoEm: '2026-01-01T00:00:00.000Z' }));
    await repo.save(entry({ consultadoEm: '2026-06-07T00:00:00.000Z' }));
    const deleted = await repo.pruneOlderThan('2026-03-01T00:00:00.000Z');
    expect(deleted).toBe(1);
    expect(await repo.list()).toHaveLength(1);
  });
});

describe('toHistoricoEntry', () => {
  const resultado: ResultadoConsulta = {
    cnpjConsultado: '00000000000191',
    geradoEm: '2026-06-08T12:00:00.000Z',
    cadastro: {
      providerId: 'brasilapi',
      ok: true,
      fetchedAt: 'now',
      data: {
        razaoSocial: 'EMPRESA REAL LTDA',
        nomeFantasia: null,
        cnpj: '00000000000191',
        uf: 'SP',
        capitalSocial: null,
        porte: null,
        naturezaJuridica: null,
        socios: [],
      },
    },
    sancoesEmpresa: { providerId: 'tcu-consolidada', ok: false, fetchedAt: 'now', error: 'x' },
    socioMajoritario: {
      selecao: { candidato: null, requerConfirmacaoManual: false, confianca: 'nenhuma', motivo: '' },
      cpfInformado: '11144477735',
      sancoesSocio: null,
    },
    temPendencia: true,
    alertas: [],
  };

  test('maps razão social and masks the sócio CPF (never stores the full CPF)', () => {
    const e = toHistoricoEntry(resultado);
    expect(e.razaoSocial).toBe('EMPRESA REAL LTDA');
    expect(e.cnpj).toBe('00000000000191');
    expect(e.temPendencia).toBe(true);
    expect(e.socioMajoritarioCpfMascarado).toBe('***.444.777-**');
    expect(JSON.stringify(e)).not.toContain('11144477735');
  });

  test('uses null mask when no CPF was provided', () => {
    const e = toHistoricoEntry({
      ...resultado,
      socioMajoritario: { ...resultado.socioMajoritario, cpfInformado: null },
    });
    expect(e.socioMajoritarioCpfMascarado).toBeNull();
  });
});
