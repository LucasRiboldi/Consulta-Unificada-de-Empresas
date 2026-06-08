import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { HistoricoEntry } from '@/storage/historico.repository';

export interface HistoricoRepoView {
  list: (limit?: number) => Promise<HistoricoEntry[]>;
  search: (query: string) => Promise<HistoricoEntry[]>;
}

export function HistoricoList({
  repo,
  reloadKey = 0,
}: {
  repo: HistoricoRepoView;
  reloadKey?: number;
}) {
  const [query, setQuery] = useState('');
  const [itens, setItens] = useState<HistoricoEntry[]>([]);

  const carregar = useCallback(
    async (q: string) => {
      const dados = q.trim() ? await repo.search(q.trim()) : await repo.list(50);
      setItens(dados);
    },
    [repo],
  );

  useEffect(() => {
    // Carga assíncrona do histórico (setState ocorre após await, não sincronamente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  function onQuery(value: string): void {
    setQuery(value);
    void carregar(value);
  }

  return (
    <section className="space-y-2">
      <div className="space-y-1">
        <label htmlFor="busca" className="text-sm font-medium">
          Buscar no histórico
        </label>
        <Input
          id="busca"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Razão social ou CNPJ"
        />
      </div>

      {itens.length === 0 ? (
        <p className="text-xs text-slate-500">Nenhuma consulta no histórico.</p>
      ) : (
        <ul className="space-y-1">
          {itens.map((e, i) => (
            <li key={e.id ?? i} className="rounded-md border border-slate-200 p-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{e.razaoSocial}</span>
                <Badge tone={e.temPendencia ? 'alerta' : 'ok'}>
                  {e.temPendencia ? 'Pendência' : 'OK'}
                </Badge>
              </div>
              <div className="text-xs text-slate-500">{e.cnpj}</div>
              {e.socioMajoritarioCpfMascarado && (
                <div className="text-xs text-slate-500">
                  Sócio: {e.socioMajoritarioNome ?? '—'} (
                  <span>{e.socioMajoritarioCpfMascarado}</span>)
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
