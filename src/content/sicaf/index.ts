/**
 * Content script do SICAF — injeta em *.comprasnet.gov.br.
 * Recebe pedido de extração do service worker e responde com os dados da página atual.
 */

import { extractSicafData } from './selectors';

export interface ExtractSicafRequest {
  readonly type: 'EXTRACT_SICAF_DATA';
  readonly cnpj: string; // CNPJ esperado (14 dígitos) para validação cruzada
}

export type ExtractSicafResponse =
  | { readonly ok: true; readonly data: ReturnType<typeof extractSicafData>; readonly url: string }
  | { readonly ok: false; readonly error: string };

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (r: ExtractSicafResponse) => void) => {
    if (
      typeof message !== 'object' ||
      message === null ||
      (message as Record<string, unknown>)['type'] !== 'EXTRACT_SICAF_DATA'
    ) {
      return false;
    }

    try {
      const data = extractSicafData(document);
      sendResponse({ ok: true, data, url: location.href });
    } catch (e) {
      sendResponse({
        ok: false,
        error: e instanceof Error ? e.message : 'Erro na extração.',
      });
    }

    return false; // resposta síncrona
  },
);
