import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { fileURLToPath } from 'node:url';
import manifest from './manifest.config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
