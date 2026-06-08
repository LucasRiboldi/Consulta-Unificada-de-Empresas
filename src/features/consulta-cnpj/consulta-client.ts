import type { ConsultarResponse } from '@/messaging/messages';

export interface RuntimeMessenger {
  runtime: { sendMessage(message: unknown): Promise<ConsultarResponse> };
}

export interface ConsultaArgs {
  readonly cnpj: string;
  readonly socioMajoritarioCpf?: string;
}

/** Envia a consulta ao service worker e devolve a resposta tipada. */
export function enviarConsulta(api: RuntimeMessenger, args: ConsultaArgs): Promise<ConsultarResponse> {
  return api.runtime.sendMessage({
    type: 'CONSULTAR_EMPRESA',
    cnpj: args.cnpj,
    ...(args.socioMajoritarioCpf !== undefined
      ? { socioMajoritarioCpf: args.socioMajoritarioCpf }
      : {}),
  });
}
