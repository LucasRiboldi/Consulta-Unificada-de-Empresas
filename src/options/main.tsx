import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsApp, type OptionsDeps } from './OptionsApp';
import { loadUserKeys, saveUserKey, getRetencaoDias, saveRetencaoDias } from '@/storage/settings.store';
import { createHistoricoRepository } from '@/storage/historico.repository';
import '@/index.css';

const historico = createHistoricoRepository();

const deps: OptionsDeps = {
  loadKey: async () => (await loadUserKeys()).transparencia ?? '',
  saveKey: (value) => saveUserKey('transparencia', value),
  loadRetencao: () => getRetencaoDias(),
  saveRetencao: (dias) => saveRetencaoDias(dias),
  clearHistorico: () => historico.clear(),
};

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <OptionsApp deps={deps} />
    </StrictMode>,
  );
}
