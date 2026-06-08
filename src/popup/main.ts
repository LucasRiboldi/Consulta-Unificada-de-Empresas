// Placeholder do popup (a UI React entra na sub-fatia 5b).
// Por ora apenas confirma que o bundle carrega e lê um CNPJ pendente do menu de contexto.
import { takePendingCnpj } from '@/storage/settings.store';

async function init(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) return;
  const pendente = await takePendingCnpj().catch(() => null);
  root.textContent = pendente
    ? `LicitCheck — CNPJ selecionado: ${pendente}`
    : 'LicitCheck — informe um CNPJ para consultar.';
}

void init();
