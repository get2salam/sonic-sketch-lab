import type { CommandRegistry } from '../commands.js';

export interface CommandPaletteControls {
  open: () => void;
  close: () => void;
}

/** Wire up the command palette dialog with search and keyboard navigation. */
export function initCommandPalette(
  palette: HTMLElement,
  input: HTMLInputElement,
  resultsList: HTMLElement,
  registry: CommandRegistry,
): CommandPaletteControls {
  function renderResults(q: string): void {
    const cmds = registry.search(q);
    resultsList.innerHTML = '';
    cmds.forEach((cmd, i) => {
      const li = document.createElement('li');
      li.className = 'palette-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      li.innerHTML =
        `<span class="palette-item-label">${cmd.label}` +
        (cmd.shortcut ? `<span class="palette-item-shortcut">${cmd.shortcut}</span>` : '') +
        `</span><span class="palette-item-desc">${cmd.description}</span>`;
      li.addEventListener('click', () => { controls.close(); void registry.execute(cmd.id); });
      resultsList.appendChild(li);
    });
  }

  function open(): void {
    palette.hidden = false;
    input.value = '';
    renderResults('');
    input.focus();
  }

  function close(): void {
    palette.hidden = true;
  }

  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      const first = resultsList.querySelector<HTMLElement>('[aria-selected="true"]');
      first?.click();
    }
  });
  palette.querySelector('.palette-backdrop')?.addEventListener('click', close);

  const controls: CommandPaletteControls = { open, close };
  return controls;
}
