import { createConsultaService } from '@/services/consulta.service';
import { createBrasilApiProvider } from '@/providers/brasilapi.provider';
import { createTcuConsolidadaProvider } from '@/providers/tcu-consolidada.provider';
import { createTransparenciaProvider } from '@/providers/transparencia.provider';
import { createSicafProvider } from '@/providers/sicaf.provider';
import { createMessageRouter } from './router';
import { setupContextMenu, type ContextMenuApi } from './context-menu';
import { loadUserKeys, loadSicafEnabled, setPendingCnpj } from '@/storage/settings.store';
import { normalizeCnpj, isValidCnpj } from '@/shared/utils/cnpj';

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
  router.handle(message).then(sendResponse);
  return true; // resposta assíncrona
});

// Menu de contexto "Consultar empresa" ao selecionar um CNPJ.
setupContextMenu(chrome as unknown as ContextMenuApi, (texto) => {
  const cnpj = normalizeCnpj(texto);
  if (!isValidCnpj(cnpj)) return;
  void setPendingCnpj(cnpj).then(() => chrome.action?.openPopup?.());
});
