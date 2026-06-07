/**
 * Contrato comum a todas as fontes de consulta (Strategy Pattern).
 * Cada fonte (BrasilAPI, Portal da Transparência, TCU, SICAF, CNJ) implementa
 * esta interface e é registrada em `registry.ts`.
 *
 * Regras de arquitetura (ver docs/ARCHITECTURE.md):
 * - Toda resposta externa DEVE ser validada com Zod antes de retornar.
 * - Chaves de API vêm do storage local do usuário (BYOK), nunca hardcoded.
 * - Providers não persistem nada; persistência é responsabilidade do Repository.
 */

/** Identificador estável de cada fonte. */
export type ProviderId =
  | 'brasilapi' // cadastro PJ + QSA (identifica sócio majoritário)
  | 'tcu-consolidada' // CEIS+CNEP+TCU+CNJ numa chamada (PJ, keyless) — primária de sanções
  | 'transparencia' // CEIS/CNEP por CPF do sócio majoritário (BYOK) + fallback PJ
  | 'sicaf'; // habilitação + sócios via content script (sessão autenticada)

/** Como a fonte é acessada — determina permissões e fluxo. */
export type ProviderAccess =
  | 'public-fetch' // fetch direto, sem credencial
  | 'user-key' // fetch direto com chave do usuário (BYOK)
  | 'content-script' // leitura de DOM da sessão autenticada (SICAF)
  | 'mock'; // sem API real ainda

export interface ProviderMeta {
  readonly id: ProviderId;
  readonly label: string;
  readonly access: ProviderAccess;
  /** Host declarado em host_permissions; undefined para mock. */
  readonly host?: string;
  /** Se exige chave do usuário, link para o cadastro oficial. */
  readonly keySignupUrl?: string;
  /** Permite desligar a fonte sem republicar (ex.: SICAF se o DOM quebrar). */
  enabled: boolean;
}

/** Resultado normalizado de uma fonte. Tipos detalhados ficam em shared/types. */
export interface ProviderResult<T = unknown> {
  readonly providerId: ProviderId;
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly fetchedAt: string; // ISO 8601
}

/** O alvo da consulta: a empresa (CNPJ) ou o sócio majoritário (CPF). Ver ADR-007. */
export type Sujeito =
  | { readonly tipo: 'pj'; readonly cnpj: string } // validado (máscara + dígito verificador)
  | { readonly tipo: 'pf'; readonly cpf: string; readonly nome?: string }; // sócio majoritário

/** Quais tipos de sujeito uma fonte aceita. */
export type SujeitoSuportado = 'pj' | 'pf';

export interface ConsultaContext {
  readonly sujeito: Sujeito;
  /** Chaves de API do usuário, por fonte. Nunca logar. */
  readonly userKeys: Partial<Record<ProviderId, string>>;
  readonly signal?: AbortSignal;
}

/** Estratégia de consulta — uma por fonte. */
export interface ConsultaProvider<T = unknown> {
  readonly meta: ProviderMeta;
  /** Sujeitos que esta fonte sabe consultar (ex.: tcu-consolidada só 'pj'). */
  readonly suporta: readonly SujeitoSuportado[];
  /** Pré-condição: provider habilitado, sujeito suportado e (se user-key) chave presente. */
  isReady(ctx: ConsultaContext): boolean;
  /** Executa a consulta. NÃO lança em erro de negócio: retorna ok:false. */
  consultar(ctx: ConsultaContext): Promise<ProviderResult<T>>;
}
