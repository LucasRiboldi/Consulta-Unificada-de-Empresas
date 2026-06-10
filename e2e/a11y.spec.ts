import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';

// Auditoria automática WCAG 2.x A/AA (axe-core) nas duas páginas da extensão,
// nos temas claro e escuro (darkMode: 'media' → emulação de prefers-color-scheme).

const esquemas = ['light', 'dark'] as const;

async function auditar(page: import('@playwright/test').Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target).join('; ')}`,
  );
}

for (const esquema of esquemas) {
  test.describe(`tema ${esquema}`, () => {
    test(`popup sem violações WCAG AA (${esquema})`, async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.emulateMedia({ colorScheme: esquema });
      await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
      await page.getByRole('heading', { name: 'LicitCheck' }).waitFor();

      expect(await auditar(page)).toEqual([]);
    });

    test(`popup com erro de validação sem violações (${esquema})`, async ({
      context,
      extensionId,
    }) => {
      const page = await context.newPage();
      await page.emulateMedia({ colorScheme: esquema });
      await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
      await page.getByLabel('CNPJ da empresa').fill('123');
      await page.getByRole('button', { name: 'Consultar' }).click();
      await page.getByRole('alert').waitFor();

      expect(await auditar(page)).toEqual([]);
    });

    test(`options sem violações WCAG AA (${esquema})`, async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.emulateMedia({ colorScheme: esquema });
      await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
      await page.getByRole('heading', { name: /Configurações/ }).waitFor();

      expect(await auditar(page)).toEqual([]);
    });
  });
}
