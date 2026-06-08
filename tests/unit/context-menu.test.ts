import { describe, test, expect, vi } from 'vitest';
import {
  CONSULTAR_MENU_ID,
  setupContextMenu,
  type ContextMenuApi,
} from '@/background/context-menu';

function fakeChrome() {
  let listener: ((info: { menuItemId: string; selectionText?: string }) => void) | undefined;
  const create = vi.fn();
  const api: ContextMenuApi = {
    contextMenus: {
      create,
      onClicked: { addListener: (fn) => (listener = fn) },
    },
  };
  return {
    api,
    create,
    fire: (info: { menuItemId: string; selectionText?: string }) => listener?.(info),
  };
}

describe('setupContextMenu', () => {
  test('creates a selection-only menu item', () => {
    const { api, create } = fakeChrome();
    setupContextMenu(api, vi.fn());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: CONSULTAR_MENU_ID,
        title: expect.stringContaining('Consultar empresa'),
        contexts: ['selection'],
      }),
    );
  });

  test('calls onConsultar with the trimmed selection when clicked', () => {
    const { api, fire } = fakeChrome();
    const onConsultar = vi.fn();
    setupContextMenu(api, onConsultar);
    fire({ menuItemId: CONSULTAR_MENU_ID, selectionText: '  00.000.000/0001-91 ' });
    expect(onConsultar).toHaveBeenCalledWith('00.000.000/0001-91');
  });

  test('ignores clicks on other menu items', () => {
    const { api, fire } = fakeChrome();
    const onConsultar = vi.fn();
    setupContextMenu(api, onConsultar);
    fire({ menuItemId: 'outro', selectionText: '123' });
    expect(onConsultar).not.toHaveBeenCalled();
  });

  test('ignores clicks with empty selection', () => {
    const { api, fire } = fakeChrome();
    const onConsultar = vi.fn();
    setupContextMenu(api, onConsultar);
    fire({ menuItemId: CONSULTAR_MENU_ID, selectionText: '   ' });
    expect(onConsultar).not.toHaveBeenCalled();
  });
});
