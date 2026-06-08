import { describe, test, expect } from 'vitest';
import { createBrasilApiProvider } from '@/providers/brasilapi.provider';
import type { ConsultaContext } from '@/providers/provider.types';

const PAYLOAD = {
  cnpj: '47960950000121',
  razao_social: 'MAGAZINE LUIZA S/A',
  nome_fantasia: 'MAGAZINE LUIZA',
  uf: 'SP',
  capital_social: 14202162000,
  porte: 'DEMAIS',
  natureza_juridica: 'Sociedade Anônima Aberta',
  qsa: [
    {
      nome_socio: 'ANDRE LUIZ DE SOUZA FATALA',
      cnpj_cpf_do_socio: '***571038**',
      qualificacao_socio: 'Diretor',
      data_entrada_sociedade: '2019-09-11',
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
  sujeito: { tipo: 'pj', cnpj: '47960950000121' },
  userKeys: {},
};

describe('brasilapi provider — metadata & isReady', () => {
  test('has stable id and supports only PJ', () => {
    const p = createBrasilApiProvider();
    expect(p.meta.id).toBe('brasilapi');
    expect(p.suporta).toEqual(['pj']);
  });

  test('not ready for a PF subject', () => {
    const p = createBrasilApiProvider();
    const ctxPf: ConsultaContext = { sujeito: { tipo: 'pf', cpf: '12345678909' }, userKeys: {} };
    expect(p.isReady(ctxPf)).toBe(false);
  });
});

describe('brasilapi provider — consultar', () => {
  test('maps cadastral data and the QSA into normalized sócios', async () => {
    const p = createBrasilApiProvider({ fetch: fakeFetch(PAYLOAD) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(true);
    expect(r.data?.razaoSocial).toBe('MAGAZINE LUIZA S/A');
    expect(r.data?.uf).toBe('SP');
    expect(r.data?.capitalSocial).toBe(14202162000);
    expect(r.data?.socios).toHaveLength(1);
    expect(r.data?.socios[0]?.nome).toBe('ANDRE LUIZ DE SOUZA FATALA');
    expect(r.data?.socios[0]?.cpfMascarado).toBe('***571038**');
    expect(r.data?.socios[0]?.qualificacao).toBe('Diretor');
  });

  test('handles empty/missing QSA as no sócios', async () => {
    const p = createBrasilApiProvider({ fetch: fakeFetch({ ...PAYLOAD, qsa: undefined }) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(true);
    expect(r.data?.socios).toEqual([]);
  });

  test('returns ok:false on HTTP error (e.g. CNPJ not found)', async () => {
    const p = createBrasilApiProvider({ fetch: fakeFetch({}, 404) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test('returns ok:false when payload fails schema validation', async () => {
    const p = createBrasilApiProvider({ fetch: fakeFetch({ razao_social: 123 }) });
    const r = await p.consultar(ctxPj);
    expect(r.ok).toBe(false);
  });
});
