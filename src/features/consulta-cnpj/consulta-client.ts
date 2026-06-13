import type { ConsultarResponse, BaixarSicafResponse } from '@/messaging/messages';

export interface RuntimeMessenger {
  runtime: { sendMessage(message: unknown): Promise<ConsultarResponse> };
}

export interface ConsultaArgs {
  readonly cnpj: string;
  readonly socioMajoritarioCpf?: string;
}

/** Envia a consulta ao service worker e devolve a resposta tipada. */
export function enviarConsulta(
  api: RuntimeMessenger,
  args: ConsultaArgs,
): Promise<ConsultarResponse> {
  return api.runtime.sendMessage({
    type: 'CONSULTAR_EMPRESA',
    cnpj: args.cnpj,
    ...(args.socioMajoritarioCpf !== undefined
      ? { socioMajoritarioCpf: args.socioMajoritarioCpf }
      : {}),
  });
}

/** Aciona o download dos documentos PDF do SICAF (Fase 2). */
export function baixarSicaf(api: RuntimeMessenger, cnpj: string): Promise<BaixarSicafResponse> {
  const enviar = api.runtime.sendMessage as (m: unknown) => Promise<BaixarSicafResponse>;
  return enviar({ type: 'BAIXAR_SICAF', cnpj });
}
