import { createConsultaService } from '@/services/consulta.service';
import { createBrasilApiProvider } from '@/providers/brasilapi.provider';
import { createTcuConsolidadaProvider } from '@/providers/tcu-consolidada.provider';
import { createTransparenciaProvider } from '@/providers/transparencia.provider';
import { createSicafProvider } from '@/providers/sicaf.provider';
import { createMessageRouter } from './router';
import { setupContextMenu, type ContextMenuApi } from './context-menu';
import { baixarDocumentosSicaf } from './sicaf-downloader';
import { loadUserKeys, loadSicafEnabled, setPendingCnpj } from '@/storage/settings.store';
import { normalizeCnpj, isValidCnpj } from '@/shared/utils/cnpj';
import { BaixarSicafRequestSchema } from '@/messaging/messages';

const sicafProvider = createSicafProvider();

const service = createConsultaService({
  brasilapi: createBrasilApiProvider(),
  tcu: createTcuConsolidadaProvider(),
  transparencia: createTransparenciaProvider(),
  sicaf: sicafProvider,
});

const router = createMessageRouter({
  service,
  loadUserKeys,
  loadSicafEnabled,
  sicafMeta: sicafProvider.meta,
});

// Mensagens do popup/options.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Fase 2: download de documentos do SICAF (só com a fonte habilitada).
  const baixar = BaixarSicafRequestSchema.safeParse(message);
  if (baixar.success) {
    void loadSicafEnabled().then((enabled) => {
      if (!enabled) {
        sendResponse({ ok: false, error: 'Ative o SICAF nas opções para baixar documentos.' });
        return;
      }
      void baixarDocumentosSicaf(baixar.data.cnpj).then(sendResponse);
    });
    return true; // resposta assíncrona
  }

  router.handle(message).then(sendResponse);
  return true; // resposta assíncrona
});

// Menu de contexto "Consultar empresa" ao selecionar um CNPJ.
setupContextMenu(chrome as unknown as ContextMenuApi, (texto) => {
  const cnpj = normalizeCnpj(texto);
  if (!isValidCnpj(cnpj)) return;
  void setPendingCnpj(cnpj).then(() => chrome.action?.openPopup?.());
});
