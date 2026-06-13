import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface OptionsDeps {
  loadKey: () => Promise<string>;
  saveKey: (value: string) => Promise<void>;
  loadRetencao: () => Promise<number>;
  saveRetencao: (dias: number) => Promise<void>;
  clearHistorico: () => Promise<void>;
  loadSicafEnabled: () => Promise<boolean>;
  saveSicafEnabled: (enabled: boolean) => Promise<void>;
  requestSicafPermission: () => Promise<boolean>;
  revokeSicafPermission: () => Promise<void>;
}

const CADASTRO_URL = 'https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email';

export function OptionsApp({ deps }: { deps: OptionsDeps }) {
  const [key, setKey] = useState('');
  const [retencao, setRetencao] = useState('180');
  const [sicafEnabled, setSicafEnabled] = useState(false);
  const [sicafLoading, setSicafLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void deps.loadKey().then(setKey);
    void deps.loadRetencao().then((d) => setRetencao(String(d)));
    void deps.loadSicafEnabled().then(setSicafEnabled);
  }, [deps]);

  async function onSalvar(): Promise<void> {
    await deps.saveKey(key.trim());
    const dias = Number.parseInt(retencao, 10);
    if (Number.isFinite(dias) && dias > 0) await deps.saveRetencao(dias);
    setFeedback('Configurações salvas.');
  }

  async function onLimpar(): Promise<void> {
    await deps.clearHistorico();
    setFeedback('Histórico limpo.');
  }

  async function onToggleSicaf(): Promise<void> {
    setSicafLoading(true);
    setFeedback(null);
    try {
      if (!sicafEnabled) {
        const granted = await deps.requestSicafPermission();
        if (!granted) {
          setFeedback('Permissão negada. O SICAF não foi ativado.');
          return;
        }
        await deps.saveSicafEnabled(true);
        setSicafEnabled(true);
        setFeedback('SICAF ativado. Abra o Comprasnet e faça login para usar.');
      } else {
        await deps.saveSicafEnabled(false);
        await deps.revokeSicafPermission();
        setSicafEnabled(false);
        setFeedback('SICAF desativado.');
      }
    } finally {
      setSicafLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 bg-white p-6 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <h1 className="text-xl font-bold">LicitCheck — Configurações</h1>

      <section className="space-y-2">
        <label htmlFor="key" className="block text-sm font-medium">
          Chave da API do Portal da Transparência (para consulta do sócio por CPF)
        </label>
        <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Opcional. A consulta de sanções da empresa não exige chave.{' '}
          <a
            className="text-blue-700 underline dark:text-blue-400"
            href={CADASTRO_URL}
            target="_blank"
            rel="noreferrer"
          >
            Cadastrar chave gratuita
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <label htmlFor="retencao" className="block text-sm font-medium">
          Retenção do histórico (dias)
        </label>
        <Input
          id="retencao"
          type="number"
          min={1}
          value={retencao}
          onChange={(e) => setRetencao(e.target.value)}
          className="w-32"
        />
      </section>

      <section className="space-y-2 rounded-md border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">SICAF — Habilitação e Sócios (Comprasnet)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lê dados de habilitação e CPF dos sócios diretamente do portal Comprasnet (sessão
              autenticada). Requer que você esteja logado na página do fornecedor no SICAF.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sicafEnabled}
            disabled={sicafLoading}
            onClick={() => void onToggleSicaf()}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
              'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
              'disabled:opacity-50',
              sicafEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0',
                'transform transition duration-200',
                sicafEnabled ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
        {sicafEnabled && (
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Ativo. Abra e faça login em{' '}
            <a
              href="https://www.comprasnet.gov.br"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              comprasnet.gov.br
            </a>{' '}
            e navegue até a página do fornecedor antes de consultar.
          </p>
        )}
      </section>

      <div className="flex gap-3">
        <Button type="button" onClick={() => void onSalvar()}>
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={() => void onLimpar()}>
          Limpar histórico
        </Button>
      </div>

      {feedback && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          {feedback}
        </p>
      )}
    </main>
  );
}
