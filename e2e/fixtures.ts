import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const DIST = path.resolve(import.meta.dirname, '..', 'dist');

interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
}

/**
 * Fixture que sobe um Chromium com a extensão (dist/) carregada e descobre o
 * ID da extensão pelo service worker MV3. Requer `npm run build` antes.
 */
export const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern -- idioma padrão de fixture do Playwright
  context: async ({}, use) => {
    if (!fs.existsSync(path.join(DIST, 'manifest.json'))) {
      throw new Error('dist/manifest.json não encontrado — rode `npm run build` antes do E2E.');
    }
    // Canal "msedge": o Chrome 137+ removeu --load-extension nos builds de marca
    // e o Chromium do Playwright falha nesta máquina com erro SxS; o Edge ainda
    // carrega extensões, inclusive em headless.
    const context = await chromium.launchPersistentContext('', {
      channel: 'msedge',
      args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    sw ??= await context.waitForEvent('serviceworker');
    await use(new URL(sw.url()).host);
  },
});

export const expect = test.expect;
