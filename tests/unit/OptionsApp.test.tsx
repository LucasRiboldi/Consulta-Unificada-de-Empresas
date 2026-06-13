// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OptionsApp, type OptionsDeps } from '@/options/OptionsApp';

function deps(over: Partial<OptionsDeps> = {}): OptionsDeps {
  return {
    loadKey: vi.fn(async () => 'CHAVE-ATUAL'),
    saveKey: vi.fn(async () => {}),
    loadRetencao: vi.fn(async () => 90),
    saveRetencao: vi.fn(async () => {}),
    clearHistorico: vi.fn(async () => {}),
    loadSicafEnabled: vi.fn(async () => false),
    saveSicafEnabled: vi.fn(async () => {}),
    requestSicafPermission: vi.fn(async () => true),
    revokeSicafPermission: vi.fn(async () => {}),
    ...over,
  };
}

describe('OptionsApp', () => {
  test('loads the current key and retention on mount', async () => {
    render(<OptionsApp deps={deps()} />);
    expect(await screen.findByDisplayValue('CHAVE-ATUAL')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('90')).toBeInTheDocument();
  });

  test('saving persists the key and the retention', async () => {
    const d = deps();
    render(<OptionsApp deps={d} />);
    await screen.findByDisplayValue('CHAVE-ATUAL');
    fireEvent.change(screen.getByLabelText(/chave/i), { target: { value: 'NOVA-CHAVE' } });
    fireEvent.change(screen.getByLabelText(/retenção/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => {
      expect(d.saveKey).toHaveBeenCalledWith('NOVA-CHAVE');
      expect(d.saveRetencao).toHaveBeenCalledWith(30);
    });
  });

  test('clear history calls the dependency and shows feedback', async () => {
    const d = deps();
    render(<OptionsApp deps={d} />);
    fireEvent.click(screen.getByRole('button', { name: /limpar histórico/i }));
    await waitFor(() => expect(d.clearHistorico).toHaveBeenCalledOnce());
    expect(await screen.findByText(/histórico (limpo|removido)/i)).toBeInTheDocument();
  });
});
