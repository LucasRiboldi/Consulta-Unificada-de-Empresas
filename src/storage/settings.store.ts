import type { ProviderId } from '@/providers/provider.types';

type UserKeys = Partial<Record<ProviderId, string>>;

const KEYS_STORAGE = 'userKeys';
const PENDING_CNPJ = 'pendingCnpj';
const RETENCAO_DIAS = 'retencaoDias';

/** Chaves de API do usuário (BYOK). Ficam em chrome.storage.local, nunca em código. */
export async function loadUserKeys(): Promise<UserKeys> {
  const out = await chrome.storage.local.get(KEYS_STORAGE);
  return (out[KEYS_STORAGE] as UserKeys | undefined) ?? {};
}

export async function saveUserKey(id: ProviderId, value: string): Promise<void> {
  const keys = await loadUserKeys();
  await chrome.storage.local.set({ [KEYS_STORAGE]: { ...keys, [id]: value } });
}

/** CNPJ selecionado via menu de contexto, lido pelo popup ao abrir. */
export async function setPendingCnpj(cnpj: string): Promise<void> {
  await chrome.storage.local.set({ [PENDING_CNPJ]: cnpj });
}

export async function takePendingCnpj(): Promise<string | null> {
  const out = await chrome.storage.local.get(PENDING_CNPJ);
  const cnpj = (out[PENDING_CNPJ] as string | undefined) ?? null;
  if (cnpj) await chrome.storage.local.remove(PENDING_CNPJ);
  return cnpj;
}

export async function getRetencaoDias(fallback = 180): Promise<number> {
  const out = await chrome.storage.local.get(RETENCAO_DIAS);
  return (out[RETENCAO_DIAS] as number | undefined) ?? fallback;
}
