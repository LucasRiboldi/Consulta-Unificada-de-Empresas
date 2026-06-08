import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { sanitizeText } from '@/security/sanitize';
import { buildConsultaView, type FonteStatus } from '@/features/consulta-cnpj/view-model';
import type { ResultadoConsulta } from '@/services/consulta.service';

const A4: [number, number] = [595, 842];
const MARGIN = 50;
const TOP = 792;

const statusLabel: Record<FonteStatus, string> = {
  ok: 'OK',
  erro: 'Erro na consulta',
  pendencia: 'PENDÊNCIA',
  limpo: 'Nada consta',
  na: 'Não consultado',
};

/** Gera o relatório em PDF desenhando campos (sem HTML — T-03). */
export async function gerarRelatorioPdf(resultado: ResultadoConsulta): Promise<Uint8Array> {
  const view = buildConsultaView(resultado);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage(A4);
  let y = TOP;

  const linha = (texto: string, opts: { size?: number; f?: PDFFont; cor?: ReturnType<typeof rgb> } = {}) => {
    const size = opts.size ?? 11;
    if (y < MARGIN + size) {
      page = doc.addPage(A4);
      y = TOP;
    }
    page.drawText(sanitizeText(texto, 110), {
      x: MARGIN,
      y,
      size,
      font: opts.f ?? font,
      color: opts.cor ?? rgb(0.1, 0.1, 0.1),
    });
    y -= size + 7;
  };

  const espaco = (h = 8) => {
    y -= h;
  };

  linha('LicitCheck - Relatorio de Consulta', { size: 18, f: bold });
  linha(`Gerado em: ${new Date(resultado.geradoEm).toLocaleString('pt-BR')}`, { size: 9 });
  espaco();

  linha('Empresa', { size: 13, f: bold });
  linha(`Razao social: ${view.titulo}`);
  linha(`CNPJ: ${view.cnpj}`);
  linha(`Situacao geral: ${view.situacaoLabel}`, {
    f: bold,
    cor: view.situacao === 'pendencia' ? rgb(0.7, 0.1, 0.1) : rgb(0.1, 0.5, 0.1),
  });
  espaco();

  linha('Consultas realizadas', { size: 13, f: bold });
  for (const fonte of view.fontes) {
    linha(`- ${fonte.nome}: ${statusLabel[fonte.status]}`);
  }
  espaco();

  if (view.socio) {
    linha('Socio majoritario (art. 12, Lei 8.429/92)', { size: 13, f: bold });
    linha(`Nome: ${view.socio.nome ?? '-'}`);
    if (view.socio.cpfMascarado) linha(`CPF: ${view.socio.cpfMascarado}`);
    if (view.socio.confirmar) linha('Atencao: confirme o socio majoritario manualmente.');
    espaco();
  }

  if (view.alertas.length > 0) {
    linha('Observacoes', { size: 13, f: bold });
    for (const a of view.alertas) linha(`- ${a}`);
  }

  return doc.save();
}
