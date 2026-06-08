import { describe, test, expect } from 'vitest';
import { createConsultaService } from '@/services/consulta.service';
import type {
  ConsultaContext,
  ConsultaProvider,
  ProviderResult,
  SujeitoSuportado,
} from '@/providers/provider.types';
import type { BrasilApiData } from '@/providers/brasilapi.provider';
import type { TcuConsolidadaData } from '@/providers/tcu-consolidada.provider';
import type { TransparenciaData } from '@/providers/transparencia.provider';

type Spy<T> = ConsultaProvider<T> & { calls: ConsultaContext[] };

function stub<T>(id: string, suporta: SujeitoSuportado[], result: ProviderResult<T>): Spy<T> {
  const calls: ConsultaContext[] = [];
  return {
    meta: { id: id as never, label: id, access: 'public-fetch', enabled: true },
    suporta,
    isReady: () => true,
    consultar: async (ctx) => {
      calls.push(ctx);
      return result;
    },
    calls,
  };
}

const CNPJ = '00000000000191';

function brasilOk(socios: BrasilApiData['socios']): ProviderResult<BrasilApiData> {
  return {
    providerId: 'brasilapi',
    ok: true,
    fetchedAt: 'now',
    data: {
      razaoSocial: 'EMPRESA X',
      nomeFantasia: null,
      cnpj: CNPJ,
      uf: 'SP',
      capitalSocial: 1000,
      porte: 'ME',
      naturezaJuridica: 'Ltda',
      socios,
    },
  };
}

function tcu(temPendencia: boolean): ProviderResult<TcuConsolidadaData> {
  return {
    providerId: 'tcu-consolidada',
    ok: true,
    fetchedAt: 'now',
    data: {
      razaoSocial: 'EMPRESA X',
      nomeFantasia: null,
      cnpj: CNPJ,
      uf: null,
      encontradoNaBaseTcu: true,
      certidoes: [],
      temPendencia,
      certidaoPdfBase64: null,
    },
  };
}

function transp(temSancao: boolean): ProviderResult<TransparenciaData> {
  return {
    providerId: 'transparencia',
    ok: true,
    fetchedAt: 'now',
    data: { codigoConsultado: 'x', temSancao, ceis: [], cnep: [] },
  };
}

const socio = (nome: string, qualificacao = 'Sócio') => ({
  nome,
  qualificacao,
  cpfMascarado: '***000000**',
  dataEntradaSociedade: null,
});

function build(over: {
  brasil?: ProviderResult<BrasilApiData>;
  tcu?: ProviderResult<TcuConsolidadaData>;
  transp?: ProviderResult<TransparenciaData>;
}) {
  const brasilapi = stub<BrasilApiData>('brasilapi', ['pj'], over.brasil ?? brasilOk([socio('A')]));
  const tcuP = stub<TcuConsolidadaData>('tcu-consolidada', ['pj'], over.tcu ?? tcu(false));
  const transparencia = stub<TransparenciaData>(
    'transparencia',
    ['pf', 'pj'],
    over.transp ?? transp(false),
  );
  const service = createConsultaService({ brasilapi, tcu: tcuP, transparencia });
  return { service, brasilapi, tcuP, transparencia };
}

describe('ConsultaService', () => {
  test('rejects an invalid CNPJ without calling providers', async () => {
    const { service, brasilapi } = build({});
    await expect(service.consultar({ cnpj: '123', userKeys: {} })).rejects.toThrow();
    expect(brasilapi.calls).toHaveLength(0);
  });

  test('queries the company on BrasilAPI and TCU with a PJ subject', async () => {
    const { service, brasilapi, tcuP } = build({});
    await service.consultar({ cnpj: CNPJ, userKeys: {} });
    expect(brasilapi.calls[0]?.sujeito).toEqual({ tipo: 'pj', cnpj: CNPJ });
    expect(tcuP.calls[0]?.sujeito).toEqual({ tipo: 'pj', cnpj: CNPJ });
  });

  test('single sócio → selection has high confidence, no manual confirmation', async () => {
    const { service } = build({ brasil: brasilOk([socio('UNICO')]) });
    const r = await service.consultar({ cnpj: CNPJ, userKeys: {} });
    expect(r.socioMajoritario.selecao.confianca).toBe('alta');
    expect(r.socioMajoritario.selecao.requerConfirmacaoManual).toBe(false);
  });

  test('multiple sócios → flags manual confirmation alert', async () => {
    const { service } = build({ brasil: brasilOk([socio('A'), socio('B')]) });
    const r = await service.consultar({ cnpj: CNPJ, userKeys: {} });
    expect(r.socioMajoritario.selecao.requerConfirmacaoManual).toBe(true);
    expect(r.alertas.some((a) => /manual/i.test(a))).toBe(true);
  });

  test('without sócio CPF → does not query Transparência and warns about art. 12', async () => {
    const { service, transparencia } = build({});
    const r = await service.consultar({ cnpj: CNPJ, userKeys: {} });
    expect(transparencia.calls).toHaveLength(0);
    expect(r.socioMajoritario.sancoesSocio).toBeNull();
    expect(r.alertas.some((a) => /art\. ?12|CPF do sócio/i.test(a))).toBe(true);
  });

  test('invalid sócio CPF → warns and does not query Transparência', async () => {
    const { service, transparencia } = build({});
    const r = await service.consultar({ cnpj: CNPJ, userKeys: {}, socioMajoritarioCpf: '123' });
    expect(transparencia.calls).toHaveLength(0);
    expect(r.alertas.some((a) => /CPF.*inválid/i.test(a))).toBe(true);
  });

  test('valid sócio CPF → queries Transparência with a PF subject', async () => {
    const { service, transparencia } = build({});
    await service.consultar({
      cnpj: CNPJ,
      userKeys: { transparencia: 'KEY' },
      socioMajoritarioCpf: '111.444.777-35',
    });
    expect(transparencia.calls[0]?.sujeito).toEqual({ tipo: 'pf', cpf: '11144477735' });
  });

  test('temPendencia is true when the company has a TCU pendency', async () => {
    const { service } = build({ tcu: tcu(true) });
    const r = await service.consultar({ cnpj: CNPJ, userKeys: {} });
    expect(r.temPendencia).toBe(true);
  });

  test('temPendencia is true when the sócio has a sanction', async () => {
    const { service } = build({ transp: transp(true) });
    const r = await service.consultar({
      cnpj: CNPJ,
      userKeys: { transparencia: 'KEY' },
      socioMajoritarioCpf: '111.444.777-35',
    });
    expect(r.temPendencia).toBe(true);
  });

  test('temPendencia is false when nothing is found', async () => {
    const { service } = build({});
    const r = await service.consultar({ cnpj: CNPJ, userKeys: {} });
    expect(r.temPendencia).toBe(false);
  });
});
