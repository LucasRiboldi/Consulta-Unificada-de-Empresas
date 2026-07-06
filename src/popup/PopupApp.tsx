import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isValidCnpj, normalizeCnpj } from '@/shared/utils/cnpj';
import {
  enviarConsulta,
  baixarSicaf,
  type RuntimeMessenger,
} from '@/features/consulta-cnpj/consulta-client';
import {
  buildConsultaView,
  type ConsultaView,
  type FonteStatus,
} from '@/features/consulta-cnpj/view-model';
import { HistoricoList, type HistoricoRepoView } from '@/features/historico/HistoricoList';
import { toHistoricoEntry, type HistoricoEntry } from '@/storage/historico.repository';
import type { ResultadoConsulta } from '@/services/consulta.service';

interface PopupHistorico extends HistoricoRepoView {
  save: (entry: HistoricoEntry) => Promise<number>;
}

interface PopupAppProps {
  readonly messenger: RuntimeMessenger;
  readonly initialCnpj?: string;
  readonly historico?: PopupHistorico;
  readonly onExportarPdf?: (resultado: ResultadoConsulta) => void | Promise<void>;
  /** Se o SICAF está ativado nas opções. Quando false, o download fica bloqueado. */
  readonly sicafEnabled?: boolean;
  /** Abre a página de opções (para o usuário ativar o SICAF). */
  readonly onAbrirOpcoes?: () => void;
}

const statusLabel: Record<FonteStatus, string> = {
  ok: 'OK',
  erro: 'Erro',
  pendencia: 'Pendência',
  limpo: 'Nada consta',
  na: 'Não consultado',
};

export function PopupApp({
  messenger,
  initialCnpj = '',
  historico,
  onExportarPdf,
  sicafEnabled = true,
  onAbrirOpcoes,
}: PopupAppProps) {
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ConsultaView | null>(null);
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);
  const [reloadHistorico, setReloadHistorico] = useState(0);
  const [baixando, setBaixando] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  async function onBaixarSicaf(): Promise<void> {
    setBaixando(true);
    setDownloadMsg(null);
    try {
      const r = await baixarSicaf(messenger, normalizeCnpj(cnpj));
      if (r.ok) {
        const ok = r.baixados.length
          ? `Baixados: ${r.baixados.join(', ')}.`
          : 'Nenhum documento disponível.';
        const skip = r.pulados.length ? ` Sem dados: ${r.pulados.join(', ')}.` : '';
        setDownloadMsg(ok + skip);
      } else {
        setDownloadMsg(r.error);
      }
    } catch (e) {
      setDownloadMsg(e instanceof Error ? e.message : 'Erro ao baixar documentos.');
    } finally {
      setBaixando(false);
    }
  }

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
        setResultado(res.resultado);
        if (historico) {
          await historico.save(toHistoricoEntry(res.resultado));
          setReloadHistorico((k) => k + 1);
        }
      } else {
        setView(null);
        setResultado(null);
        setErro(res.error);
      }
    } catch (e) {
      setView(null);
      setResultado(null);
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-[380px] space-y-4 bg-white p-4 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">LicitCheck</h1>
        <span className="text-xs text-slate-500 dark:text-slate-400">Consulta unificada</span>
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
            inputMode="numeric"
            aria-invalid={erro === 'CNPJ inválido.'}
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

      {erro && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {erro}
        </p>
      )}

      {view && (
        <section
          aria-live="polite"
          className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold leading-tight">{view.titulo}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{view.cnpj}</p>
            </div>
            <Badge tone={view.situacao === 'pendencia' ? 'alerta' : 'ok'}>
              {view.situacaoLabel}
            </Badge>
          </div>

          {onExportarPdf && resultado && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void onExportarPdf(resultado)}
            >
              Exportar PDF
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={baixando || !sicafEnabled}
            onClick={() => void onBaixarSicaf()}
          >
            {baixando ? 'Baixando documentos…' : 'Baixar documentos do SICAF (PDF)'}
          </Button>

          {!sicafEnabled && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O download exige o SICAF ativado (Comprasnet) e login em{' '}
              <a
                href="https://www.comprasnet.gov.br"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                comprasnet.gov.br
              </a>
              .{' '}
              {onAbrirOpcoes && (
                <button
                  type="button"
                  onClick={onAbrirOpcoes}
                  className="underline hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Ativar nas opções
                </button>
              )}
            </p>
          )}

          {downloadMsg && (
            <p
              role="status"
              className="rounded-md bg-slate-50 p-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {downloadMsg}
            </p>
          )}

          <ul className="space-y-1 text-sm">
            {view.fontes.map((f) => (
              <li key={f.id} className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">{f.nome}</span>
                <span className="font-medium">{statusLabel[f.status]}</span>
              </li>
            ))}
          </ul>

          {view.socio && (
            <div className="rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800">
              <p className="font-medium">Sócio majoritário</p>
              <p>{view.socio.nome ?? '—'}</p>
              {view.socio.cpfMascarado && (
                <p className="text-slate-500 dark:text-slate-400">{view.socio.cpfMascarado}</p>
              )}
              {view.socio.confirmar && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Confirme o sócio majoritário manualmente.
                </p>
              )}
            </div>
          )}

          {view.alertas.length > 0 && (
            <ul className="space-y-1">
              {view.alertas.map((a, i) => (
                <li
                  key={i}
                  className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                >
                  {a}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {historico && (
        <section className="border-t border-slate-200 pt-3 dark:border-slate-700">
          <h2 className="mb-2 text-sm font-semibold">Histórico</h2>
          <HistoricoList repo={historico} reloadKey={reloadHistorico} />
        </section>
      )}
    </main>
  );
}
