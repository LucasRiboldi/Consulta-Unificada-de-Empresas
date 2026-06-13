import { describe, test, expect, vi } from 'vitest';
import { createSicafProvider, type SicafData } from '@/providers/sicaf.provider';
import type { ConsultaContext } from '@/providers/provider.types';

const CNPJ = '91852087000180';

const ctxPj = (cnpj = CNPJ): ConsultaContext => ({
  sujeito: { tipo: 'pj', cnpj },
  userKeys: {},
});

const sicafExtraido = (cnpj = CNPJ): SicafData => ({
  cnpj,
  razaoSocial: 'CONSTRUSINOS IND E COM DE ARTEFATOS DE CIMENTO LTDA',
  nomeFantasia: 'CONSTRUSINOS',
  uf: null,
  habilitado: true,
  statusHabilitacao: 'Credenciado',
  socios: [
    {
      nome: 'LUIS ANTONIO DA SILVA',
      documento: '37351753091',
      tipoDocumento: 'cpf',
      participacaoSocietaria: 57.5,
      possuiPendencia: false,
    },
    {
      nome: 'MARCOS ANTONIO DA SILVA',
      documento: '29740606091',
      tipoDocumento: 'cpf',
      participacaoSocietaria: 42.5,
      possuiPendencia: false,
    },
  ],
  seletoresVersao: '2.0.0',
});

/**
 * chrome falso que simula a máquina de estados da aba: antes do FILL a extração
 * não tem resultado; depois do FILL retorna os dados.
 */
function fakeChrome(opts: {
  pingReady?: boolean;
  extractAfterFill?: SicafData | null;
  failCreate?: boolean;
}) {
  let pesquisou = false;
  const removed: number[] = [];
  const created: chrome.tabs.CreateProperties[] = [];

  const tabs = {
    create: vi.fn(async (props: chrome.tabs.CreateProperties) => {
      if (opts.failCreate) throw new Error('sem permissão');
      created.push(props);
      return { id: 42 } as chrome.tabs.Tab;
    }),
    remove: vi.fn(async (id: number) => {
      removed.push(id);
    }),
    sendMessage: vi.fn(async (_id: number, msg: { type: string }) => {
      if (msg.type === 'SICAF_PING') {
        if (opts.pingReady === false) throw new Error('content script ausente');
        return { ready: true, url: 'x' };
      }
      if (msg.type === 'SICAF_FILL_SEARCH') {
        pesquisou = true;
        return { ok: true };
      }
      if (msg.type === 'EXTRACT_SICAF_DATA') {
        if (!pesquisou) return { ok: true, data: null }; // sem resultado ainda
        return { ok: true, data: opts.extractAfterFill ?? null };
      }
      return undefined;
    }),
  };
  return { chrome: { tabs } as unknown as typeof globalThis.chrome, removed, created };
}

const TIMEOUTS = { prontoMs: 200, extractMs: 200, pollMs: 5 };

describe('SICAF provider (navegação ativa)', () => {
  test('rejeita sujeito que não é PJ', async () => {
    const { chrome } = fakeChrome({ extractAfterFill: sicafExtraido() });
    const p = createSicafProvider({ chrome, timeouts: TIMEOUTS });
    const r = await p.consultar({ sujeito: { tipo: 'pf', cpf: '11144477735' }, userKeys: {} });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/apenas PJ/i);
  });

  test('navega, pesquisa e extrai o quadro societário com sucesso', async () => {
    const env = fakeChrome({ extractAfterFill: sicafExtraido() });
    const p = createSicafProvider({ chrome: env.chrome, timeouts: TIMEOUTS });
    const r = await p.consultar(ctxPj());
    expect(r.ok).toBe(true);
    expect(r.data?.razaoSocial).toContain('CONSTRUSINOS');
    expect(r.data?.socios[0]?.documento).toBe('37351753091');
    // abriu aba em segundo plano e a fechou ao final
    expect(env.created[0]).toMatchObject({ active: false });
    expect(env.removed).toContain(42);
  });

  test('fecha a aba mesmo quando dá erro (login ausente)', async () => {
    const env = fakeChrome({ pingReady: false });
    const p = createSicafProvider({ chrome: env.chrome, timeouts: TIMEOUTS });
    const r = await p.consultar(ctxPj());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/login no Comprasnet/i);
    expect(env.removed).toContain(42);
  });

  test('erro quando a permissão de aba não é concedida', async () => {
    const env = fakeChrome({ failCreate: true });
    const p = createSicafProvider({ chrome: env.chrome, timeouts: TIMEOUTS });
    const r = await p.consultar(ctxPj());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/permissão/i);
  });

  test('detecta CNPJ divergente entre página e consulta', async () => {
    const env = fakeChrome({ extractAfterFill: sicafExtraido('11111111111111') });
    const p = createSicafProvider({ chrome: env.chrome, timeouts: TIMEOUTS });
    const r = await p.consultar(ctxPj());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/difere do consultado/i);
  });
});
