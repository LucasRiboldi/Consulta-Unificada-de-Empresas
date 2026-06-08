import { describe, test, expect } from 'vitest';
import { createTransparenciaProvider } from '@/providers/transparencia.provider';
import type { ConsultaContext } from '@/providers/provider.types';

const SANCAO = {
  dataInicioSancao: '01/01/2020',
  dataFimSancao: '01/01/2025',
  tipoSancao: { descricaoResumida: 'Inidônea' },
  orgaoSancionador: { nome: 'CGU' },
  fundamentacao: [],
  textoPublicacao: 'texto',
  linkPublicacao: 'https://x',
};

/** Fake fetch que roteia por endpoint e registra os headers enviados. */
function routingFetch(opts: {
  ceis?: unknown;
  cnep?: unknown;
  status?: number;
  capture?: { headers?: Headers; urls: string[] };
}): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    if (opts.capture) {
      opts.capture.urls.push(url);
      opts.capture.headers = new Headers(init?.headers);
    }
    const status = opts.status ?? 200;
    const body = url.includes('/ceis') ? (opts.ceis ?? []) : (opts.cnep ?? []);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

const ctxPf = (key?: string): ConsultaContext => ({
  sujeito: { tipo: 'pf', cpf: '11144477735' },
  userKeys: key ? { transparencia: key } : {},
});

describe('transparencia provider — metadata & isReady', () => {
  test('has stable id and supports PF and PJ', () => {
    const p = createTransparenciaProvider();
    expect(p.meta.id).toBe('transparencia');
    expect([...p.suporta].sort()).toEqual(['pf', 'pj']);
  });

  test('not ready without the user API key (BYOK)', () => {
    const p = createTransparenciaProvider();
    expect(p.isReady(ctxPf())).toBe(false);
  });

  test('ready with the user API key', () => {
    const p = createTransparenciaProvider();
    expect(p.isReady(ctxPf('MY-KEY'))).toBe(true);
  });
});

describe('transparencia provider — consultar', () => {
  test('sends the chave-api-dados header and queries by codigoSancionado', async () => {
    const capture: { headers?: Headers; urls: string[] } = { urls: [] };
    const p = createTransparenciaProvider({ fetch: routingFetch({ capture }) });
    await p.consultar(ctxPf('MY-KEY'));
    expect(capture.headers?.get('chave-api-dados')).toBe('MY-KEY');
    expect(capture.urls.some((u) => u.includes('codigoSancionado=11144477735'))).toBe(true);
    expect(capture.urls.some((u) => u.includes('/ceis'))).toBe(true);
    expect(capture.urls.some((u) => u.includes('/cnep'))).toBe(true);
  });

  test('no sanction when both lists are empty', async () => {
    const p = createTransparenciaProvider({ fetch: routingFetch({ ceis: [], cnep: [] }) });
    const r = await p.consultar(ctxPf('MY-KEY'));
    expect(r.ok).toBe(true);
    expect(r.data?.temSancao).toBe(false);
  });

  test('flags sanction when CEIS returns a record', async () => {
    const p = createTransparenciaProvider({ fetch: routingFetch({ ceis: [SANCAO], cnep: [] }) });
    const r = await p.consultar(ctxPf('MY-KEY'));
    expect(r.ok).toBe(true);
    expect(r.data?.temSancao).toBe(true);
    expect(r.data?.ceis).toHaveLength(1);
    expect(r.data?.ceis[0]?.dataInicioSancao).toBe('01/01/2020');
  });

  test('returns ok:false when key is missing', async () => {
    const p = createTransparenciaProvider({ fetch: routingFetch({}) });
    const r = await p.consultar(ctxPf());
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test('returns ok:false on HTTP error', async () => {
    const p = createTransparenciaProvider({ fetch: routingFetch({ status: 403 }) });
    const r = await p.consultar(ctxPf('MY-KEY'));
    expect(r.ok).toBe(false);
  });
});
