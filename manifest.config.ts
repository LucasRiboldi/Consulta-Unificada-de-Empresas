import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

// Permissões e CSP seguem o ADR-004 (menor privilégio, sem unsafe-inline/eval).
export default defineManifest({
  manifest_version: 3,
  name: 'LicitCheck',
  version: pkg.version,
  description:
    'Consulta unificada de empresas e do sócio majoritário (art. 12) para processos licitatórios. 100% local.',
  icons: {
    16: 'public/icons/icon-16.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: { 16: 'public/icons/icon-16.png', 48: 'public/icons/icon-48.png' },
  },
  options_page: 'src/options/index.html',
  background: { service_worker: 'src/background/service-worker.ts', type: 'module' },
  permissions: ['contextMenus', 'storage', 'downloads'],
  host_permissions: [
    'https://brasilapi.com.br/*',
    'https://certidoes-apf.apps.tcu.gov.br/*',
    'https://api.portaldatransparencia.gov.br/*',
  ],
  optional_permissions: ['scripting'],
  optional_host_permissions: ['https://*.comprasnet.gov.br/*'],
  content_security_policy: {
    extension_pages:
      "script-src 'self'; object-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://brasilapi.com.br https://certidoes-apf.apps.tcu.gov.br https://api.portaldatransparencia.gov.br; base-uri 'none'; form-action 'none'",
  },
});
