import { describe, test, expect, vi } from 'vitest';
import { baixarDocumentosSicaf } from '@/background/sicaf-downloader';

const TIMEOUTS = { prontoMs: 200, pollMs: 5, downloadMs: 60 };

/**
 * chrome falso: simula a aba SICAF. Relatórios em `comDados` disparam onCreated
 * (download) quando clicados; os demais não geram nada (sem dados).
 */
function fakeChrome(opts: {
  relatorios: { id: string; texto: string }[];
  comDados: Set<string>;
  contratoBaixa?: boolean;
}) {
  const listeners: Array<() => void> = [];
  const downloads = {
    onCreated: {
      addListener: (fn: () => void) => listeners.push(fn),
      removeListener: vi.fn(),
    },
  };
  const dispararDownload = () => listeners.forEach((fn) => fn());

  const removed: number[] = [];
  const tabs = {
    create: vi.fn(async () => ({ id: 7 }) as chrome.tabs.Tab),
    update: vi.fn(async () => ({}) as chrome.tabs.Tab),
    remove: vi.fn(async (id: number) => {
      removed.push(id);
    }),
    sendMessage: vi.fn(async (_id: number, msg: { type: string; id?: string }) => {
      switch (msg.type) {
        case 'SICAF_PING':
          return { ready: true };
        case 'SICAF_FILL_SEARCH':
          return { ok: true };
        case 'SICAF_LISTAR_RELATORIOS':
          return { ok: true, relatorios: opts.relatorios };
        case 'SICAF_CLICAR':
          if (msg.id && opts.comDados.has(msg.id)) dispararDownload();
          return { ok: true };
        case 'SICAF_CLICAR_CONTRATO':
          if (opts.contratoBaixa) dispararDownload();
          return { ok: true };
        default:
          return undefined;
      }
    }),
  };
  return { chrome: { tabs, downloads } as unknown as typeof globalThis.chrome, removed };
}

describe('baixarDocumentosSicaf (Fase 2)', () => {
  test('baixa só os relatórios com dados e pula os vazios', async () => {
    const relatorios = [
      { id: 'form:fornecedores:0:detalharLink', texto: 'Situação do Fornecedor' },
      { id: 'form:fornecedores:0:relatorioOcorrenciasLink', texto: 'Ocorrências Ativas' },
    ];
    const env = fakeChrome({
      relatorios,
      comDados: new Set(['form:fornecedores:0:detalharLink']),
      contratoBaixa: true,
    });
    const r = await baixarDocumentosSicaf('91852087000180', {
      chrome: env.chrome,
      timeouts: TIMEOUTS,
    });

    expect(r.ok).toBe(true);
    expect(r.baixados).toContain('Situação do Fornecedor');
    expect(r.baixados).toContain('Contrato Social');
    expect(r.pulados).toContain('Ocorrências Ativas');
    expect(env.removed).toContain(7); // aba fechada no fim
  });

  test('erro quando não consegue acessar (não logado)', async () => {
    const env = fakeChrome({ relatorios: [], comDados: new Set() });
    // sobrescreve PING para nunca ficar pronto
    (env.chrome.tabs.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      throw new Error('sem content script');
    });
    const r = await baixarDocumentosSicaf('91852087000180', {
      chrome: env.chrome,
      timeouts: TIMEOUTS,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Comprasnet/i);
    expect(env.removed).toContain(7);
  });
});
