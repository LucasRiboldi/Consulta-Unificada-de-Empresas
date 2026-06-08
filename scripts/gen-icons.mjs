// Gera os ícones PNG da extensão a partir de public/icons/icon.svg.
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const svg = join(dir, 'icon.svg');
const sizes = [16, 48, 128];

for (const size of sizes) {
  const out = join(dir, `icon-${size}.png`);
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log(`gerado ${out}`);
}
