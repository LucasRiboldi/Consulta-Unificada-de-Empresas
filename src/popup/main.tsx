import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import { takePendingCnpj } from '@/storage/settings.store';
import type { RuntimeMessenger } from '@/features/consulta-cnpj/consulta-client';
import '@/index.css';

async function bootstrap(): Promise<void> {
  const el = document.getElementById('root');
  if (!el) return;
  const pendente = await takePendingCnpj().catch(() => null);
  createRoot(el).render(
    <StrictMode>
      <PopupApp messenger={chrome as unknown as RuntimeMessenger} initialCnpj={pendente ?? ''} />
    </StrictMode>,
  );
}

void bootstrap();
