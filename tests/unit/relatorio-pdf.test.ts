import { describe, test, expect } from 'vitest';
import { gerarRelatorioPdf } from '@/pdf/relatorio';
import type { ResultadoConsulta } from '@/services/consulta.service';

function resultado(over: Partial<ResultadoConsulta> = {}): ResultadoConsulta {
  return {
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
    socioMajoritario: {
      selecao: { candidato: null, requerConfirmacaoManual: false, confianca: 'nenhuma', motivo: '' },
      cpfInformado: null,
      sancoesSocio: null,
    },
    temPendencia: false,
    alertas: ['CPF do sócio majoritário não informado — consulta do art. 12 incompleta.'],
    ...over,
  };
}

const head = (bytes: Uint8Array, n = 5) => String.fromCharCode(...bytes.slice(0, n));

describe('gerarRelatorioPdf', () => {
  test('produz um PDF válido (cabeçalho %PDF-)', async () => {
    const bytes = await gerarRelatorioPdf(resultado());
    expect(head(bytes)).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1000);
  });

  test('não quebra com strings maliciosas/emoji (sanitização)', async () => {
    const malicioso = resultado({
      cadastro: {
        providerId: 'brasilapi',
        ok: true,
        fetchedAt: 'now',
        data: {
          razaoSocial: 'EMPRESA 🚀 <script>alert(1)</script> 名',
          nomeFantasia: null,
          cnpj: '00000000000191',
          uf: 'SP',
          capitalSocial: null,
          porte: null,
          naturezaJuridica: null,
          socios: [],
        },
      },
    });
    const bytes = await gerarRelatorioPdf(malicioso);
    expect(head(bytes)).toBe('%PDF-');
  });

  test('inclui CPF mascarado e nunca o CPF completo quando há sócio', async () => {
    const bytes = await gerarRelatorioPdf(
      resultado({
        socioMajoritario: {
          selecao: {
            candidato: { nome: 'FULANO', qualificacao: 'Sócio', cpfMascarado: '', dataEntradaSociedade: null },
            requerConfirmacaoManual: false,
            confianca: 'alta',
            motivo: '',
          },
          cpfInformado: '11144477735',
          sancoesSocio: { providerId: 'transparencia', ok: true, fetchedAt: 'now', data: { codigoConsultado: 'x', temSancao: false, ceis: [], cnep: [] } },
        },
      }),
    );
    const texto = String.fromCharCode(...bytes);
    expect(texto).not.toContain('11144477735');
  });
});
