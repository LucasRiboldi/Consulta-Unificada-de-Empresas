import { describe, test, expect, vi } from 'vitest';
import { enviarConsulta, type RuntimeMessenger } from '@/features/consulta-cnpj/consulta-client';

function messenger(response: unknown = { ok: true }) {
  const sendMessage = vi.fn(async () => response);
  const api = { runtime: { sendMessage } } as unknown as RuntimeMessenger;
  return { api, sendMessage };
}

describe('enviarConsulta', () => {
  test('envia a mensagem CONSULTAR_EMPRESA e devolve a resposta', async () => {
    const { api, sendMessage } = messenger({ ok: true, resultado: {} });
    const res = await enviarConsulta(api, { cnpj: '00000000000191' });
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'CONSULTAR_EMPRESA',
      cnpj: '00000000000191',
    });
    expect(res.ok).toBe(true);
  });

  test('inclui o CPF do sócio quando informado', async () => {
    const { api, sendMessage } = messenger();
    await enviarConsulta(api, { cnpj: '00000000000191', socioMajoritarioCpf: '11144477735' });
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'CONSULTAR_EMPRESA',
      cnpj: '00000000000191',
      socioMajoritarioCpf: '11144477735',
    });
  });
});
