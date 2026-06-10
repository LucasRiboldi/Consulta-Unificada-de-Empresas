// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { exportarRelatorioPdf } from '@/pdf/download';
import type { ResultadoConsulta } from '@/services/consulta.service';

function resultado(): ResultadoConsulta {
  return {
    cnpjConsultado: '00000000000191',
    geradoEm: '2026-06-08T14:30:00.000Z',
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
    sancoesEmpresa: { providerId: 'tcu-consolidada', ok: false, fetchedAt: 'now', error: 'x' },
    socioMajoritario: {
      selecao: {
        candidato: null,
        requerConfirmacaoManual: false,
        confianca: 'nenhuma',
        motivo: '',
      },
      cpfInformado: null,
      sancoesSocio: null,
    },
    temPendencia: false,
    alertas: [],
  };
}

beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:fake'),
    revokeObjectURL: vi.fn(),
  });
});

describe('exportarRelatorioPdf', () => {
  test('cria um link de download com o nome de arquivo correto e dispara o clique', async () => {
    const click = vi.fn();
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    await exportarRelatorioPdf(resultado(), { buscarCertidao: async () => null });

    expect(createElement).toHaveBeenCalledWith('a');
    expect(anchor.download).toMatch(/^EMPRESA_TESTE_LTDA_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/);
    expect(anchor.href).toBe('blob:fake');
    expect(click).toHaveBeenCalledOnce();
    createElement.mockRestore();
  });

  test('busca a certidão oficial pelo CNPJ consultado e ainda exporta se a busca falhar', async () => {
    const click = vi.fn();
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const buscarCertidao = vi.fn(async () => {
      throw new Error('rede caiu');
    });

    await exportarRelatorioPdf(resultado(), { buscarCertidao });

    expect(buscarCertidao).toHaveBeenCalledWith('00000000000191');
    expect(click).toHaveBeenCalledOnce();
    createElement.mockRestore();
  });
});
