import { describe, test, expect, vi } from 'vitest';
import { createMessageRouter } from '@/background/router';
import type { ResultadoConsulta } from '@/services/consulta.service';

const fakeResultado = { cnpjConsultado: '00000000000191', temPendencia: false } as ResultadoConsulta;

function build(consultarImpl?: (input: unknown) => Promise<ResultadoConsulta>) {
  const consultar = vi.fn(consultarImpl ?? (async () => fakeResultado));
  const loadUserKeys = vi.fn(async () => ({ transparencia: 'KEY' }));
  const router = createMessageRouter({ service: { consultar }, loadUserKeys });
  return { router, consultar, loadUserKeys };
}

describe('message router', () => {
  test('handles a valid CONSULTAR_EMPRESA message and returns the result', async () => {
    const { router, consultar } = build();
    const res = await router.handle({ type: 'CONSULTAR_EMPRESA', cnpj: '00000000000191' });
    expect(res.ok).toBe(true);
    expect(consultar).toHaveBeenCalledOnce();
  });

  test('injects the loaded user keys into the service call', async () => {
    const { router, consultar } = build();
    await router.handle({
      type: 'CONSULTAR_EMPRESA',
      cnpj: '00000000000191',
      socioMajoritarioCpf: '11144477735',
    });
    expect(consultar).toHaveBeenCalledWith(
      expect.objectContaining({
        cnpj: '00000000000191',
        socioMajoritarioCpf: '11144477735',
        userKeys: { transparencia: 'KEY' },
      }),
    );
  });

  test('rejects an unknown message type without calling the service', async () => {
    const { router, consultar } = build();
    const res = await router.handle({ type: 'NOPE' });
    expect(res.ok).toBe(false);
    expect(consultar).not.toHaveBeenCalled();
  });

  test('rejects a message missing the cnpj', async () => {
    const { router, consultar } = build();
    const res = await router.handle({ type: 'CONSULTAR_EMPRESA' });
    expect(res.ok).toBe(false);
    expect(consultar).not.toHaveBeenCalled();
  });

  test('surfaces a service error as ok:false', async () => {
    const { router } = build(async () => {
      throw new Error('CNPJ inválido.');
    });
    const res = await router.handle({ type: 'CONSULTAR_EMPRESA', cnpj: '123' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('CNPJ inválido');
  });
});
