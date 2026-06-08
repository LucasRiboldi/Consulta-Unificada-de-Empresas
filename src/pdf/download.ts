import { gerarRelatorioPdf } from './relatorio';
import { buildNomeArquivo } from './nome-arquivo';
import type { ResultadoConsulta } from '@/services/consulta.service';

/** Gera o relatório e dispara o download (Blob + âncora, sem dependências externas). */
export async function exportarRelatorioPdf(resultado: ResultadoConsulta): Promise<void> {
  const bytes = await gerarRelatorioPdf(resultado);
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
