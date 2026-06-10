import { test, expect } from './fixtures';

// E2E sem rede: valida que a extensão carrega de verdade no Chrome (MV3),
// que popup/options renderizam e que a validação local funciona.
// O fluxo de consulta (com APIs mockadas) é coberto pelos testes unitários.

test('o service worker MV3 registra e expõe o ID da extensão', async ({ extensionId }) => {
  expect(extensionId).toMatch(/^[a-p]{32}$/);
});

test.describe('popup', () => {
  test('renderiza o formulário de consulta', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await expect(page.getByRole('heading', { name: 'LicitCheck' })).toBeVisible();
    await expect(page.getByLabel('CNPJ da empresa')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Consultar' })).toBeEnabled();
  });

  test('CNPJ inválido mostra erro acessível (role=alert) sem sair da página', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await page.getByLabel('CNPJ da empresa').fill('11.111.111/1111-11');
    await page.getByRole('button', { name: 'Consultar' }).click();

    await expect(page.getByRole('alert')).toHaveText('CNPJ inválido.');
  });
});

test.describe('options', () => {
  test('salva configurações e confirma com role=status', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);

    await page.getByLabel('Retenção do histórico (dias)').fill('90');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('status')).toHaveText('Configurações salvas.');

    // Recarrega: o valor persistiu no chrome.storage.
    await page.reload();
    await expect(page.getByLabel('Retenção do histórico (dias)')).toHaveValue('90');
  });
});
