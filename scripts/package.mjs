// Empacota o conteúdo de dist/ num .zip versionado para upload na Chrome Web Store.
// Uso: npm run package  (roda o build antes)
import AdmZip from 'adm-zip';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const outDir = join(root, 'release');

if (!existsSync(dist)) {
  console.error('dist/ não encontrado. Rode "npm run build" antes.');
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
mkdirSync(outDir, { recursive: true });

const zip = new AdmZip();
zip.addLocalFolder(dist);
const out = join(outDir, `licitcheck-v${version}.zip`);
zip.writeZip(out);
console.log(`pacote gerado: ${out}`);
