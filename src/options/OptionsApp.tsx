import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface OptionsDeps {
  loadKey: () => Promise<string>;
  saveKey: (value: string) => Promise<void>;
  loadRetencao: () => Promise<number>;
  saveRetencao: (dias: number) => Promise<void>;
  clearHistorico: () => Promise<void>;
}

const CADASTRO_URL = 'https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email';

export function OptionsApp({ deps }: { deps: OptionsDeps }) {
  const [key, setKey] = useState('');
  const [retencao, setRetencao] = useState('180');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void deps.loadKey().then(setKey);
    void deps.loadRetencao().then((d) => setRetencao(String(d)));
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

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6 text-slate-900">
      <h1 className="text-xl font-bold">LicitCheck — Configurações</h1>

      <section className="space-y-2">
        <label htmlFor="key" className="block text-sm font-medium">
          Chave da API do Portal da Transparência (para consulta do sócio por CPF)
        </label>
        <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
        <p className="text-xs text-slate-500">
          Opcional. A consulta de sanções da empresa não exige chave.{' '}
          <a className="text-blue-700 underline" href={CADASTRO_URL} target="_blank" rel="noreferrer">
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

      <div className="flex gap-3">
        <Button type="button" onClick={() => void onSalvar()}>
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={() => void onLimpar()}>
          Limpar histórico
        </Button>
      </div>

      {feedback && <p className="text-sm text-green-700">{feedback}</p>}
    </main>
  );
}
