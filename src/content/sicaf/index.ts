/**
 * Content script do SICAF — injeta em *.comprasnet.gov.br.
 * Orquestrado pelo service worker (sicaf.provider): responde a PING (pronto),
 * preenche+pesquisa o CNPJ (FILL_SEARCH) e extrai os dados da página (EXTRACT).
 * Tudo determinístico — sem IA.
 */

import {
  extractSicafData,
  preencherCnpjEPesquisar,
  listarRelatorios,
  clicarPorId,
  clicarContratoSocial,
} from './selectors';

export type SicafMessage =
  | { readonly type: 'SICAF_PING' }
  | { readonly type: 'SICAF_FILL_SEARCH'; readonly cnpj: string }
  | { readonly type: 'EXTRACT_SICAF_DATA'; readonly cnpj?: string }
  | { readonly type: 'SICAF_LISTAR_RELATORIOS' }
  | { readonly type: 'SICAF_CLICAR'; readonly id: string }
  | { readonly type: 'SICAF_CLICAR_CONTRATO' };

function lerString(message: unknown, chave: string): string | undefined {
  if (typeof message !== 'object' || message === null) return undefined;
  const v = (message as Record<string, unknown>)[chave];
  return typeof v === 'string' ? v : undefined;
}

function tipo(message: unknown): string | undefined {
  return lerString(message, 'type');
}

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (r: unknown) => void) => {
    switch (tipo(message)) {
      case 'SICAF_PING':
        sendResponse({ ok: true, ready: true, url: location.href });
        return false;

      case 'SICAF_FILL_SEARCH':
        try {
          sendResponse(preencherCnpjEPesquisar(lerString(message, 'cnpj') ?? '', document));
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : 'Erro ao pesquisar.' });
        }
        return false;

      case 'EXTRACT_SICAF_DATA':
        try {
          const data = extractSicafData(document, lerString(message, 'cnpj'));
          sendResponse({ ok: true, data, url: location.href });
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : 'Erro na extração.' });
        }
        return false;

      case 'SICAF_LISTAR_RELATORIOS':
        try {
          sendResponse({ ok: true, relatorios: listarRelatorios(document) });
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : 'Erro ao listar.' });
        }
        return false;

      case 'SICAF_CLICAR':
        try {
          sendResponse(clicarPorId(lerString(message, 'id') ?? '', document));
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : 'Erro ao clicar.' });
        }
        return false;

      case 'SICAF_CLICAR_CONTRATO':
        try {
          sendResponse(clicarContratoSocial(document));
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : 'Erro ao clicar.' });
        }
        return false;

      default:
        return false;
    }
  },
);
