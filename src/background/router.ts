import { ConsultarRequestSchema, type ConsultarResponse } from '@/messaging/messages';
import type { ConsultaInput, ResultadoConsulta } from '@/services/consulta.service';
import type { ProviderMeta, ProviderId } from '@/providers/provider.types';

type UserKeys = Partial<Record<ProviderId, string>>;

export interface MessageRouterDeps {
  readonly service: { consultar(input: ConsultaInput): Promise<ResultadoConsulta> };
  readonly loadUserKeys: () => Promise<UserKeys>;
  readonly loadSicafEnabled: () => Promise<boolean>;
  /** Referência mutável ao meta do provider SICAF para atualizar enabled dinamicamente. */
  readonly sicafMeta: ProviderMeta;
}

export function createMessageRouter(deps: MessageRouterDeps) {
  return {
    async handle(message: unknown): Promise<ConsultarResponse> {
      const parsed = ConsultarRequestSchema.safeParse(message);
      if (!parsed.success) {
        return { ok: false, error: 'Mensagem inválida.' };
      }

      try {
        const [userKeys, sicafEnabled] = await Promise.all([
          deps.loadUserKeys(),
          deps.loadSicafEnabled(),
        ]);
        deps.sicafMeta.enabled = sicafEnabled;

        const input: ConsultaInput = {
          cnpj: parsed.data.cnpj,
          userKeys,
          ...(parsed.data.socioMajoritarioCpf !== undefined
            ? { socioMajoritarioCpf: parsed.data.socioMajoritarioCpf }
            : {}),
        };
        const resultado = await deps.service.consultar(input);
        return { ok: true, resultado };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Erro na consulta.' };
      }
    },
  };
}
