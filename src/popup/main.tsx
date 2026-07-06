import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import { takePendingCnpj, loadSicafEnabled } from '@/storage/settings.store';
import { createHistoricoRepository } from '@/storage/historico.repository';
import { exportarRelatorioPdf } from '@/pdf/download';
import type { RuntimeMessenger } from '@/features/consulta-cnpj/consulta-client';
import '@/index.css';

async function bootstrap(): Promise<void> {
  const el = document.getElementById('root');
  if (!el) return;
  const pendente = await takePendingCnpj().catch(() => null);
  const sicafEnabled = await loadSicafEnabled().catch(() => false);
  const historico = createHistoricoRepository();
  createRoot(el).render(
    <StrictMode>
      <PopupApp
        messenger={chrome as unknown as RuntimeMessenger}
        initialCnpj={pendente ?? ''}
        historico={historico}
        onExportarPdf={exportarRelatorioPdf}
        sicafEnabled={sicafEnabled}
        onAbrirOpcoes={() => chrome.runtime.openOptionsPage?.()}
      />
    </StrictMode>,
  );
}

void bootstrap();
