import { describe, test, expect } from 'vitest';
import { buildConsultaView } from '@/features/consulta-cnpj/view-model';
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
        razaoSocial: 'EMPRESA X LTDA',
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
        razaoSocial: 'EMPRESA X LTDA',
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
    alertas: ['alerta A'],
    ...over,
  };
}

describe('buildConsultaView', () => {
  test('título usa a razão social; CNPJ presente', () => {
    const v = buildConsultaView(resultado());
    expect(v.titulo).toBe('EMPRESA X LTDA');
    expect(v.cnpj).toBe('00000000000191');
  });

  test('título cai para o CNPJ quando o cadastro falhou', () => {
    const v = buildConsultaView(
      resultado({ cadastro: { providerId: 'brasilapi', ok: false, fetchedAt: 'now', error: 'x' } }),
    );
    expect(v.titulo).toBe('00000000000191');
  });

  test('situação é "pendencia" quando há pendência', () => {
    const v = buildConsultaView(resultado({ temPendencia: true }));
    expect(v.situacao).toBe('pendencia');
  });

  test('fonte TCU reflete pendência; BrasilAPI ok; Transparência "na" quando não consultada', () => {
    const v = buildConsultaView(resultado());
    const tcu = v.fontes.find((f) => f.id === 'tcu-consolidada');
    const brasil = v.fontes.find((f) => f.id === 'brasilapi');
    const transp = v.fontes.find((f) => f.id === 'transparencia');
    expect(brasil?.status).toBe('ok');
    expect(tcu?.status).toBe('limpo');
    expect(transp?.status).toBe('na');
  });

  test('sócio mascara o CPF e sinaliza confirmação manual', () => {
    const v = buildConsultaView(
      resultado({
        socioMajoritario: {
          selecao: {
            candidato: {
              nome: 'FULANO',
              qualificacao: 'Sócio',
              cpfMascarado: '',
              dataEntradaSociedade: null,
            },
            requerConfirmacaoManual: true,
            confianca: 'baixa',
            motivo: '',
          },
          cpfInformado: '11144477735',
          sancoesSocio: {
            providerId: 'transparencia',
            ok: true,
            fetchedAt: 'now',
            data: { codigoConsultado: 'x', temSancao: false, ceis: [], cnep: [] },
          },
        },
      }),
    );
    expect(v.socio?.nome).toBe('FULANO');
    expect(v.socio?.cpfMascarado).toBe('***.444.777-**');
    expect(v.socio?.confirmar).toBe(true);
  });

  test('alertas são repassados', () => {
    expect(buildConsultaView(resultado()).alertas).toEqual(['alerta A']);
  });
});
