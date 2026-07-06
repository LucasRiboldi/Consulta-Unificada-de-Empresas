// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PopupApp } from '@/popup/PopupApp';
import type { RuntimeMessenger } from '@/features/consulta-cnpj/consulta-client';
import type { ResultadoConsulta } from '@/services/consulta.service';
import type { HistoricoEntry } from '@/storage/historico.repository';

const resultado: ResultadoConsulta = {
  cnpjConsultado: '00000000000191',
  geradoEm: '2026-06-08T12:00:00.000Z',
  cadastro: {
    providerId: 'brasilapi',
    ok: true,
    fetchedAt: 'now',
    data: {
      razaoSocial: 'EMPRESA TESTE LTDA',
      nomeFantasia: null,
      cnpj: '00000000000191',
      uf: 'SP',
      capitalSocial: null,
      porte: null,
      naturezaJuridica: null,
      socios: [],
    },
  },
  sancoesEmpresa: {
    providerId: 'tcu-consolidada',
    ok: true,
    fetchedAt: 'now',
    data: {
      razaoSocial: 'EMPRESA TESTE LTDA',
      nomeFantasia: null,
      cnpj: '00000000000191',
      uf: null,
      encontradoNaBaseTcu: true,
      certidoes: [],
      temPendencia: false,
      certidaoPdfBase64: null,
    },
  },
  sancoesEmpresaTransparencia: null,
  socioMajoritario: {
    selecao: { candidato: null, requerConfirmacaoManual: false, confianca: 'nenhuma', motivo: '' },
    cpfInformado: null,
    sancoesSocio: null,
    pendenciaSicaf: null,
  },
  sicaf: null,
  temPendencia: false,
  alertas: ['CPF do sócio majoritário não informado — consulta do art. 12 incompleta.'],
};

function messenger(response: unknown = { ok: true, resultado }): {
  api: RuntimeMessenger;
  sendMessage: ReturnType<typeof vi.fn>;
} {
  const sendMessage = vi.fn(async () => response);
  return { api: { runtime: { sendMessage } } as unknown as RuntimeMessenger, sendMessage };
}

describe('PopupApp', () => {
  test('renders the app title', () => {
    const { api } = messenger();
    render(<PopupApp messenger={api} />);
    expect(screen.getByText(/LicitCheck/i)).toBeInTheDocument();
  });

  test('shows a validation error and does not query for an invalid CNPJ', () => {
    const { api, sendMessage } = messenger();
    render(<PopupApp messenger={api} />);
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }));
    expect(screen.getByText(/CNPJ inválido/i)).toBeInTheDocument();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('o erro é anunciável por leitores de tela (role=alert)', () => {
    const { api } = messenger();
    render(<PopupApp messenger={api} />);
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/CNPJ inválido/i);
  });

  test('queries and renders the result for a valid CNPJ', async () => {
    const { api, sendMessage } = messenger();
    render(<PopupApp messenger={api} />);
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: '00.000.000/0001-91' } });
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }));
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(await screen.findByText('EMPRESA TESTE LTDA')).toBeInTheDocument();
    expect(screen.getByText(/Nada consta/i)).toBeInTheDocument();
  });

  test('shows the art. 12 alert from the result', async () => {
    const { api } = messenger();
    render(<PopupApp messenger={api} />);
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: '00000000000191' } });
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }));
    await waitFor(() => expect(screen.getByText(/art\. ?12/i)).toBeInTheDocument());
  });

  test('saves the result to history on success', async () => {
    const { api } = messenger();
    const historico = {
      save: vi.fn(async (_e: HistoricoEntry) => 1),
      list: vi.fn(async () => [] as HistoricoEntry[]),
      search: vi.fn(async () => [] as HistoricoEntry[]),
    };
    render(<PopupApp messenger={api} historico={historico} />);
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: '00000000000191' } });
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }));
    await waitFor(() => expect(historico.save).toHaveBeenCalledOnce());
    expect(historico.save.mock.calls[0]?.[0]?.razaoSocial).toBe('EMPRESA TESTE LTDA');
  });

  test('exporta o PDF do resultado ao clicar em Exportar PDF', async () => {
    const { api } = messenger();
    const onExportarPdf = vi.fn();
    render(<PopupApp messenger={api} onExportarPdf={onExportarPdf} />);
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: '00000000000191' } });
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }));
    const botao = await screen.findByRole('button', { name: /exportar pdf/i });
    fireEvent.click(botao);
    await waitFor(() => expect(onExportarPdf).toHaveBeenCalledOnce());
    expect(onExportarPdf.mock.calls[0]?.[0]?.cnpjConsultado).toBe('00000000000191');
  });

  test('renders a backend error message', async () => {
    const { api } = messenger({ ok: false, error: 'Falha na consulta.' });
    render(<PopupApp messenger={api} />);
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: '00000000000191' } });
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }));
    expect(await screen.findByText(/Falha na consulta/i)).toBeInTheDocument();
  });
});
