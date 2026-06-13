/**
 * Downloader de documentos do SICAF (Fase 2) — determinístico, sem IA.
 *
 * Abre uma aba em segundo plano, pesquisa o CNPJ e baixa os relatórios disponíveis
 * (tela "Situação do Fornecedor") + o Contrato Social (Nível II). Clica um botão por
 * vez e usa `chrome.downloads.onCreated` para saber quando cada PDF começou a baixar,
 * pulando relatórios sem dados (que não geram download).
 */

import {
  aguardarPronto,
  dormir,
  SICAF_SITUACAO_URL,
  SICAF_NIVEL2_URL,
  type ChromeApi,
} from '@/providers/sicaf.provider';

export interface DownloadSicafResult {
  readonly ok: boolean;
  /** Documentos cujo download foi iniciado. */
  readonly baixados: string[];
  /** Relatórios sem dados (nenhum download gerado). */
  readonly pulados: string[];
  readonly error?: string;
}

interface Opts {
  readonly chrome?: ChromeApi;
  readonly timeouts?: { prontoMs?: number; pollMs?: number; downloadMs?: number };
}

const PRONTO_MS = 12_000;
const POLL_MS = 500;
const DOWNLOAD_MS = 6_000;

async function msg(cr: ChromeApi, tabId: number, m: unknown): Promise<unknown> {
  return cr.tabs.sendMessage(tabId, m);
}

/** Espera até `cond()` ou timeout. */
async function aguardar(timeoutMs: number, pollMs: number, cond: () => boolean): Promise<boolean> {
  const fim = Date.now() + timeoutMs;
  while (Date.now() < fim) {
    if (cond()) return true;
    await dormir(pollMs);
  }
  return cond();
}

export async function baixarDocumentosSicaf(
  cnpjRaw: string,
  opts: Opts = {},
): Promise<DownloadSicafResult> {
  const cr = opts.chrome ?? globalThis.chrome;
  const prontoMs = opts.timeouts?.prontoMs ?? PRONTO_MS;
  const pollMs = opts.timeouts?.pollMs ?? POLL_MS;
  const downloadMs = opts.timeouts?.downloadMs ?? DOWNLOAD_MS;
  const cnpj = cnpjRaw.replace(/\D/g, '');

  const baixados: string[] = [];
  const pulados: string[] = [];
  const fail = (error: string): DownloadSicafResult => ({ ok: false, baixados, pulados, error });

  let novosDownloads = 0;
  const onCreated = (): void => {
    novosDownloads += 1;
  };
  cr.downloads?.onCreated?.addListener(onCreated);

  let tabId: number | undefined;
  try {
    const tab = await cr.tabs.create({ url: SICAF_SITUACAO_URL, active: false });
    tabId = tab.id ?? undefined;
    if (tabId === undefined) return fail('Não foi possível abrir a aba do SICAF.');

    if (!(await aguardarPronto(cr, tabId, prontoMs, pollMs))) {
      return fail('Não foi possível acessar o SICAF. Faça login no Comprasnet (gov.br).');
    }

    // Pesquisa o CNPJ na tela de Situação do Fornecedor.
    await msg(cr, tabId, { type: 'SICAF_FILL_SEARCH', cnpj }).catch(() => undefined);
    await aguardarPronto(cr, tabId, prontoMs, pollMs);

    const lista = (await msg(cr, tabId, { type: 'SICAF_LISTAR_RELATORIOS' }).catch(
      () => undefined,
    )) as { ok?: boolean; relatorios?: { id: string; texto: string }[] } | undefined;
    const relatorios = lista?.relatorios ?? [];

    // Clica um relatório por vez; espera o download começar (ou pula se não houver dados).
    for (const r of relatorios) {
      novosDownloads = 0;
      await msg(cr, tabId, { type: 'SICAF_CLICAR', id: r.id }).catch(() => undefined);
      const baixou = await aguardar(downloadMs, pollMs, () => novosDownloads > 0);
      (baixou ? baixados : pulados).push(r.texto);
    }

    // Contrato Social (Nível II): navega, pesquisa e baixa.
    await cr.tabs.update(tabId, { url: SICAF_NIVEL2_URL });
    await aguardarPronto(cr, tabId, prontoMs, pollMs);
    await msg(cr, tabId, { type: 'SICAF_FILL_SEARCH', cnpj }).catch(() => undefined);
    await aguardarPronto(cr, tabId, prontoMs, pollMs);

    novosDownloads = 0;
    const cc = (await msg(cr, tabId, { type: 'SICAF_CLICAR_CONTRATO' }).catch(() => undefined)) as
      | { ok?: boolean }
      | undefined;
    if (cc?.ok) {
      const baixou = await aguardar(downloadMs, pollMs, () => novosDownloads > 0);
      (baixou ? baixados : pulados).push('Contrato Social');
    } else {
      pulados.push('Contrato Social');
    }

    return { ok: true, baixados, pulados };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Erro ao baixar documentos do SICAF.');
  } finally {
    cr.downloads?.onCreated?.removeListener(onCreated);
    if (tabId !== undefined) void cr.tabs.remove(tabId).catch(() => undefined);
  }
}
