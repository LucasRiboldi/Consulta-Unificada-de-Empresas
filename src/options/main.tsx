import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsApp, type OptionsDeps } from './OptionsApp';
import {
  loadUserKeys,
  saveUserKey,
  getRetencaoDias,
  saveRetencaoDias,
  loadSicafEnabled,
  saveSicafEnabled,
} from '@/storage/settings.store';
import { createHistoricoRepository } from '@/storage/historico.repository';
import '@/index.css';

const historico = createHistoricoRepository();

const SICAF_ORIGINS = ['https://*.comprasnet.gov.br/*'];

const deps: OptionsDeps = {
  loadKey: async () => (await loadUserKeys()).transparencia ?? '',
  saveKey: (value) => saveUserKey('transparencia', value),
  loadRetencao: () => getRetencaoDias(),
  saveRetencao: (dias) => saveRetencaoDias(dias),
  clearHistorico: () => historico.clear(),
  loadSicafEnabled,
  saveSicafEnabled,
  requestSicafPermission: () => chrome.permissions.request({ origins: SICAF_ORIGINS }),
  revokeSicafPermission: () =>
    chrome.permissions.remove({ origins: SICAF_ORIGINS }).then(() => undefined),
};

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <OptionsApp deps={deps} />
    </StrictMode>,
  );
}
