// Sanitizacao de strings antes de irem para o PDF (T-03/T-04). pdf-lib desenha
// texto com fontes WinAnsi (0-255); caracteres fora disso quebram a codificacao.

const SPACE = 0x20;
const DEL = 0x7f;
const WINANSI_MAX = 0xff;
const COMBINING_START = 0x300;
const COMBINING_END = 0x36f;

/** Remove controles, caracteres fora do WinAnsi e limita o tamanho. */
export function sanitizeText(input: string, maxLen = 200): string {
  const limpo = Array.from(input)
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c < SPACE || c === DEL) return ' '; // controle -> espaco
      if (c > WINANSI_MAX) return ''; // fora do WinAnsi -> remove
      return ch;
    })
    .join('');
  return limpo.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

/** Reduz a um nome de arquivo seguro: [A-Z0-9_-], sem path traversal. */
export function sanitizeFilename(input: string, maxLen = 60): string {
  const semAcento = Array.from(input.normalize('NFD'))
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      return !(c >= COMBINING_START && c <= COMBINING_END);
    })
    .join('');
  const safe = semAcento
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, maxLen);
  return safe || 'EMPRESA';
}
