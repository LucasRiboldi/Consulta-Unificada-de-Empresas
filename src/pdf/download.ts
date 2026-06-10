import { anexarCertidaoOficial, gerarRelatorioPdf } from './relatorio';
import { buildNomeArquivo } from './nome-arquivo';
import { fetchCertidaoPdfBase64 } from '@/providers/tcu-consolidada.provider';
import type { ResultadoConsulta } from '@/services/consulta.service';

interface ExportDeps {
  /** Busca a certidão oficial do TCU (base64) — injetável para testes. */
  readonly buscarCertidao?: (cnpj: string) => Promise<string | null>;
}

/**
 * Gera o relatório, anexa a certidão oficial do TCU (quando disponível) e
 * dispara o download (Blob + âncora, sem dependências externas). A certidão é
 * melhoria opcional: qualquer falha na busca não impede a exportação.
 */
export async function exportarRelatorioPdf(
  resultado: ResultadoConsulta,
  deps: ExportDeps = {},
): Promise<void> {
  const buscarCertidao = deps.buscarCertidao ?? fetchCertidaoPdfBase64;
  let bytes = await gerarRelatorioPdf(resultado);

  const certidaoBase64 = await buscarCertidao(resultado.cnpjConsultado).catch(() => null);
  if (certidaoBase64) {
    bytes = await anexarCertidaoOficial(bytes, certidaoBase64);
  }

  const razao =
    (resultado.cadastro.ok ? resultado.cadastro.data?.razaoSocial : undefined) ??
    resultado.cnpjConsultado;
  const nome = buildNomeArquivo(razao, new Date(resultado.geradoEm));

  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
