import Dexie, { type Table } from 'dexie';
import { maskCpf } from '@/shared/utils/mask';
import type { ResultadoConsulta } from '@/services/consulta.service';

/** Registro do histórico. NÃO armazena CPF em claro (ADR-008). */
export interface HistoricoEntry {
  id?: number;
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly socioMajoritarioNome: string | null;
  readonly socioMajoritarioCpfMascarado: string | null;
  readonly temPendencia: boolean;
  /** ISO 8601 — ordenável lexicograficamente. */
  readonly consultadoEm: string;
}

/** Constrói um registro de histórico a partir do resultado, mascarando o CPF. */
export function toHistoricoEntry(resultado: ResultadoConsulta): HistoricoEntry {
  const razaoSocial =
    (resultado.cadastro.ok ? resultado.cadastro.data?.razaoSocial : undefined) ??
    (resultado.sancoesEmpresa.ok ? resultado.sancoesEmpresa.data?.razaoSocial : undefined) ??
    resultado.cnpjConsultado;

  const cpf = resultado.socioMajoritario.cpfInformado;

  return {
    cnpj: resultado.cnpjConsultado,
    razaoSocial,
    socioMajoritarioNome: resultado.socioMajoritario.selecao.candidato?.nome ?? null,
    socioMajoritarioCpfMascarado: cpf ? maskCpf(cpf) : null,
    temPendencia: resultado.temPendencia,
    consultadoEm: resultado.geradoEm,
  };
}

class HistoricoDb extends Dexie {
  readonly consultas!: Table<HistoricoEntry, number>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({
      consultas: '++id, cnpj, razaoSocial, consultadoEm, temPendencia',
    });
  }
}

export interface HistoricoRepository {
  save(entry: HistoricoEntry): Promise<number>;
  list(limit?: number): Promise<HistoricoEntry[]>;
  search(query: string): Promise<HistoricoEntry[]>;
  clear(): Promise<void>;
  pruneOlderThan(isoCutoff: string): Promise<number>;
}

export function createHistoricoRepository(dbName = 'licitcheck'): HistoricoRepository {
  const db = new HistoricoDb(dbName);

  return {
    async save(entry) {
      return db.consultas.add(entry);
    },

    async list(limit) {
      let coll = db.consultas.orderBy('consultadoEm').reverse();
      if (limit !== undefined) coll = coll.limit(limit);
      return coll.toArray();
    },

    async search(query) {
      const q = query.trim().toLowerCase();
      if (q === '') return this.list();
      const all = await db.consultas.toArray();
      return all.filter(
        (e) => e.cnpj.toLowerCase().includes(q) || e.razaoSocial.toLowerCase().includes(q),
      );
    },

    async clear() {
      await db.consultas.clear();
    },

    async pruneOlderThan(isoCutoff) {
      return db.consultas.where('consultadoEm').below(isoCutoff).delete();
    },
  };
}
