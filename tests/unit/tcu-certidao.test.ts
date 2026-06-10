import { describe, test, expect } from 'vitest';
import { fetchCertidaoPdfBase64 } from '@/providers/tcu-consolidada.provider';

function fakeFetch(body: unknown, status = 200): { fetch: typeof fetch; urls: string[] } {
  const urls: string[] = [];
  const fakeImpl = async (url: string): Promise<Response> => {
    urls.push(url);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetch: fakeImpl as unknown as typeof fetch, urls };
}

describe('fetchCertidaoPdfBase64', () => {
  test('solicita a emissão do PDF (seEmitirPDF=true) e devolve o base64', async () => {
    const f = fakeFetch({
      cnpj: '00.000.000/0001-91',
      razaoSocial: 'X',
      seCnpjEncontradoNaBaseTcu: true,
      certidoes: [],
      certidaoPDF: 'QkFTRTY0',
    });
    const base64 = await fetchCertidaoPdfBase64('00000000000191', { fetch: f.fetch });
    expect(base64).toBe('QkFTRTY0');
    expect(f.urls.some((u) => u.includes('seEmitirPDF=true'))).toBe(true);
  });

  test('devolve null quando não há PDF na resposta', async () => {
    const f = fakeFetch({
      cnpj: '00.000.000/0001-91',
      razaoSocial: 'X',
      seCnpjEncontradoNaBaseTcu: true,
      certidoes: [],
      certidaoPDF: null,
    });
    expect(await fetchCertidaoPdfBase64('00000000000191', { fetch: f.fetch })).toBeNull();
  });

  test('devolve null em erro HTTP (sem lançar)', async () => {
    const f = fakeFetch({}, 500);
    expect(await fetchCertidaoPdfBase64('00000000000191', { fetch: f.fetch })).toBeNull();
  });
});
