import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isValidCnpj, normalizeCnpj } from '@/shared/utils/cnpj';
import { enviarConsulta, type RuntimeMessenger } from '@/features/consulta-cnpj/consulta-client';
import { buildConsultaView, type ConsultaView, type FonteStatus } from '@/features/consulta-cnpj/view-model';
import { HistoricoList, type HistoricoRepoView } from '@/features/historico/HistoricoList';
import { toHistoricoEntry, type HistoricoEntry } from '@/storage/historico.repository';

interface PopupHistorico extends HistoricoRepoView {
  save: (entry: HistoricoEntry) => Promise<number>;
}

interface PopupAppProps {
  readonly messenger: RuntimeMessenger;
  readonly initialCnpj?: string;
  readonly historico?: PopupHistorico;
}

const statusLabel: Record<FonteStatus, string> = {
  ok: 'OK',
  erro: 'Erro',
  pendencia: 'Pendência',
  limpo: 'Nada consta',
  na: 'Não consultado',
};

export function PopupApp({ messenger, initialCnpj = '', historico }: PopupAppProps) {
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ConsultaView | null>(null);
  const [reloadHistorico, setReloadHistorico] = useState(0);

  async function onConsultar(): Promise<void> {
    const digits = normalizeCnpj(cnpj);
    if (!isValidCnpj(digits)) {
      setErro('CNPJ inválido.');
      setView(null);
      return;
    }
    setErro(null);
    setLoading(true);
    try {
      const cpfTrim = cpf.trim();
      const res = await enviarConsulta(messenger, {
        cnpj: digits,
        ...(cpfTrim ? { socioMajoritarioCpf: cpfTrim } : {}),
      });
      if (res.ok) {
        setView(buildConsultaView(res.resultado));
        if (historico) {
          await historico.save(toHistoricoEntry(res.resultado));
          setReloadHistorico((k) => k + 1);
        }
      } else {
        setView(null);
        setErro(res.error);
      }
    } catch (e) {
      setView(null);
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-[380px] space-y-4 p-4 text-slate-900">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">LicitCheck</h1>
        <span className="text-xs text-slate-500">Consulta unificada</span>
      </header>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void onConsultar();
        }}
      >
        <div className="space-y-1">
          <label htmlFor="cnpj" className="text-sm font-medium">
            CNPJ da empresa
          </label>
          <Input
            id="cnpj"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0001-91"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="cpf" className="text-sm font-medium">
            CPF do sócio majoritário (opcional — art. 12)
          </label>
          <Input
            id="cpf"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="Somente com a chave da API configurada"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Consultando…' : 'Consultar'}
        </Button>
      </form>

      {erro && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{erro}</p>}

      {view && (
        <section className="space-y-3 border-t border-slate-200 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold leading-tight">{view.titulo}</h2>
              <p className="text-xs text-slate-500">{view.cnpj}</p>
            </div>
            <Badge tone={view.situacao === 'pendencia' ? 'alerta' : 'ok'}>{view.situacaoLabel}</Badge>
          </div>

          <ul className="space-y-1 text-sm">
            {view.fontes.map((f) => (
              <li key={f.id} className="flex justify-between">
                <span className="text-slate-600">{f.nome}</span>
                <span className="font-medium">{statusLabel[f.status]}</span>
              </li>
            ))}
          </ul>

          {view.socio && (
            <div className="rounded-md bg-slate-50 p-2 text-sm">
              <p className="font-medium">Sócio majoritário</p>
              <p>{view.socio.nome ?? '—'}</p>
              {view.socio.cpfMascarado && <p className="text-slate-500">{view.socio.cpfMascarado}</p>}
              {view.socio.confirmar && (
                <p className="mt-1 text-xs text-amber-700">Confirme o sócio majoritário manualmente.</p>
              )}
            </div>
          )}

          {view.alertas.length > 0 && (
            <ul className="space-y-1">
              {view.alertas.map((a, i) => (
                <li key={i} className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  {a}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {historico && (
        <section className="border-t border-slate-200 pt-3">
          <h2 className="mb-2 text-sm font-semibold">Histórico</h2>
          <HistoricoList repo={historico} reloadKey={reloadHistorico} />
        </section>
      )}
    </main>
  );
}
