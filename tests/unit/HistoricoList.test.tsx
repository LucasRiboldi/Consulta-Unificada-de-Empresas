// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoricoList } from '@/features/historico/HistoricoList';
import type { HistoricoEntry } from '@/storage/historico.repository';

const entry = (over: Partial<HistoricoEntry> = {}): HistoricoEntry => ({
  cnpj: '00000000000191',
  razaoSocial: 'EMPRESA X',
  socioMajoritarioNome: 'FULANO',
  socioMajoritarioCpfMascarado: '***.444.777-**',
  temPendencia: false,
  consultadoEm: '2026-06-08T10:00:00.000Z',
  ...over,
});

function repo(list: HistoricoEntry[], search: HistoricoEntry[] = []) {
  return {
    list: vi.fn(async () => list),
    search: vi.fn(async (_q: string) => search),
  };
}

describe('HistoricoList', () => {
  test('renders entries from the repository on mount', async () => {
    const r = repo([entry({ razaoSocial: 'EMPRESA A' }), entry({ razaoSocial: 'EMPRESA B' })]);
    render(<HistoricoList repo={r} />);
    expect(await screen.findByText('EMPRESA A')).toBeInTheDocument();
    expect(screen.getByText('EMPRESA B')).toBeInTheDocument();
  });

  test('shows the masked CPF and never leaks a full CPF', async () => {
    const r = repo([entry()]);
    render(<HistoricoList repo={r} />);
    expect(await screen.findByText('***.444.777-**')).toBeInTheDocument();
  });

  test('typing a query calls search and shows the filtered result', async () => {
    const r = repo([entry({ razaoSocial: 'TODAS' })], [entry({ razaoSocial: 'FILTRADA' })]);
    render(<HistoricoList repo={r} />);
    await screen.findByText('TODAS');
    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: 'filt' } });
    await waitFor(() => expect(r.search).toHaveBeenCalledWith('filt'));
    expect(await screen.findByText('FILTRADA')).toBeInTheDocument();
  });
});
