import { z } from 'zod';
import type { ResultadoConsulta } from '@/services/consulta.service';

/** Mensagem de consulta enviada por popup/menu de contexto ao service worker. */
export const ConsultarRequestSchema = z.object({
  type: z.literal('CONSULTAR_EMPRESA'),
  cnpj: z.string(),
  socioMajoritarioCpf: z.string().optional(),
});

export type ConsultarRequest = z.infer<typeof ConsultarRequestSchema>;

export type ConsultarResponse =
  | { readonly ok: true; readonly resultado: ResultadoConsulta }
  | { readonly ok: false; readonly error: string };
