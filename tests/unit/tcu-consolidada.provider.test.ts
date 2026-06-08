import { describe, test, expect } from 'vitest';
import { createTcuConsolidadaProvider } from '@/providers/tcu-consolidada.provider';
import type { ConsultaContext } from '@/providers/provider.types';

const PAYLOAD = {
  certidaoPDF: null,
  cnpj: '00.000.000/0001-91',
  razaoSocial: 'Banco do Brasil S.A.',
  nomeFantasia: null,
  uf: null,
  seCnpjEncontradoNaBaseTcu: true,
  dataHoraGeracaoInMillis: 1700000000000,
  certidoes: [
    {
      tipo: 'Inidôneos',
      emissor: 'TCU',
      descricao: 'Licitantes Inidôneos',
      situacao: 'NADA_CONSTA',
      linkConsultaManual: 'https://x',
      observacao: null,
    },
    {
      tipo: 'CEIS',
      emissor: 'CGU',
      descricao: 'Empresas Inidôneas e Suspensas',
      situacao: 'NADA_CONSTA',
      linkConsultaManual: 'https://x',
      observacao: null,
    },
    {
      tipo: 'CNEP',
      emissor: 'CGU',
      descricao: 'Empresas Punidas',
      situacao: 'NADA_CONSTA',
      linkConsultaManual: 'https://x',
      observacao: null,
    },
    {
      tipo: 'Improbidade',
      emissor: 'CNJ',
      descricao: 'CNIA',
      situacao: 'NADA_CONSTA',
      linkConsultaManual: 'https://x',
      observacao: null,
    },
  ],
};

function fakeFetch(body: unknown, status = 200): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;
}

const ctxPj: ConsultaContext = {
  sujeito: { tipo: 'pj', cnpj: '00000000000191' },
  userKeys: {},
};

describe('tcu-consolidada provider — metadata', () => {
  test('has stable id and supports only PJ', () => {
    const p = createTcuConsolidadaProvider();
    expect(p.meta.id).toBe('tcu-consolidada');
    expect(p.suporta).toEqual(['pj']);
  });
});

describe('tcu-consolidada provider — isReady', () => {
  test('ready for a PJ subject when enabled', () => {
    const p = createTcuConsolidadaProvider();
    expect(p.isReady(ctxPj)).toBe(true);
  });

  test('not ready for a PF subject (CPF not supported by this source)', () => {
    const p = createTcuConsolidadaProvider();
    const ctxPf: ConsultaContext = { sujeito: { tipo: 'pf', cpf: '12345678909' }, userKeys: {} };
    expect(p.isReady(ctxPf)).toBe(false);
  });
});

describe('tcu-consolidada provider — consultar', () => {
  test('maps the consolidated payload and reports no pending sanction', async () => {
    const p = createTcuConsolidadaProvider({ fetch: fakeFetch(PAYLOAD) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(true);
    expect(r.providerId).toBe('tcu-consolidada');
    expect(r.data?.razaoSocial).toBe('Banco do Brasil S.A.');
    expect(r.data?.certidoes).toHaveLength(4);
    expect(r.data?.temPendencia).toBe(false);
  });

  test('flags a pending sanction when any certidao is not NADA_CONSTA', async () => {
    const dirty = {
      ...PAYLOAD,
      certidoes: [
        ...PAYLOAD.certidoes.slice(0, 3),
        { ...PAYLOAD.certidoes[3], situacao: 'CONSTA' },
      ],
    };
    const p = createTcuConsolidadaProvider({ fetch: fakeFetch(dirty) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(true);
    expect(r.data?.temPendencia).toBe(true);
  });

  test('returns ok:false on HTTP error without throwing', async () => {
    const p = createTcuConsolidadaProvider({ fetch: fakeFetch({}, 500) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test('returns ok:false when the payload fails schema validation', async () => {
    const p = createTcuConsolidadaProvider({ fetch: fakeFetch({ cnpj: 123 }) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(false);
  });
});
