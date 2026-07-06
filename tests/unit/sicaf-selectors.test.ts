// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { listarRelatorios } from '@/content/sicaf/selectors';

function docFrom(html: string): Document {
  const d = document.implementation.createHTMLDocument('sicaf');
  d.body.innerHTML = html;
  return d;
}

describe('listarRelatorios', () => {
  test('detecta relatórios pelo id JSF do bloco de resultado', () => {
    const doc = docFrom(`
      <a id="form:menu:consultar">Consultar</a>
      <a id="form:fornecedores:0:btn">Nível I - Credenciamento</a>
      <button id="form:fornecedores:1:btn">Ocorrências</button>
    `);
    const rel = listarRelatorios(doc);
    expect(rel.map((r) => r.texto)).toEqual(['Nível I - Credenciamento', 'Ocorrências']);
  });

  test('fallback por rótulo quando os ids JSF não contêm :fornecedores:', () => {
    const doc = docFrom(`
      <a id="nav-home">Início</a>
      <a id="rel-n1">Nível I - Credenciamento</a>
      <a id="rel-n4">Nível IV - Regularidade Fiscal</a>
      <button id="rel-oco">Ocorrências</button>
      <a id="rel-sem-id-irrelevante">Ajuda</a>
    `);
    const rel = listarRelatorios(doc);
    expect(rel.map((r) => r.id)).toEqual(['rel-n1', 'rel-n4', 'rel-oco']);
  });

  test('fallback ignora elementos sem id (não clicáveis por id)', () => {
    const doc = docFrom(`<a>Nível II - Habilitação Jurídica</a>`);
    expect(listarRelatorios(doc)).toEqual([]);
  });
});
