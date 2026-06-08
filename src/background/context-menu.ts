export const CONSULTAR_MENU_ID = 'licitcheck-consultar';

/** Subconjunto mínimo da API chrome.contextMenus usado aqui (facilita teste). */
export interface ContextMenuApi {
  contextMenus: {
    create(props: { id: string; title: string; contexts: readonly string[] }): unknown;
    onClicked: {
      addListener(
        cb: (info: { menuItemId: string | number; selectionText?: string }) => void,
      ): void;
    };
  };
}

/** Registra o item "Consultar empresa" (apenas em seleção de texto) e o handler de clique. */
export function setupContextMenu(api: ContextMenuApi, onConsultar: (texto: string) => void): void {
  api.contextMenus.create({
    id: CONSULTAR_MENU_ID,
    title: 'Consultar empresa',
    contexts: ['selection'],
  });

  api.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== CONSULTAR_MENU_ID) return;
    const texto = (info.selectionText ?? '').trim();
    if (texto === '') return;
    onConsultar(texto);
  });
}
