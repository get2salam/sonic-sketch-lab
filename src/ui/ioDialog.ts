export interface IoDialogCallbacks {
  onCopy: (text: string) => Promise<void>;
  onLoad: (json: string) => void;
  onClose: () => void;
}

export interface IoDialogControls {
  openExport: (json: string) => void;
  openImport: () => void;
  close: () => void;
}

/** Wire up the export/import JSON dialog, returning open/close helpers. */
export function initIoDialog(
  dialog: HTMLElement,
  textarea: HTMLTextAreaElement,
  copyBtn: HTMLElement,
  loadBtn: HTMLElement,
  closeBtn: HTMLElement,
  callbacks: IoDialogCallbacks,
): IoDialogControls {
  copyBtn.addEventListener('click', () => void callbacks.onCopy(textarea.value));
  loadBtn.addEventListener('click', () => callbacks.onLoad(textarea.value));
  closeBtn.addEventListener('click', callbacks.onClose);
  dialog.querySelector('.dialog-backdrop')?.addEventListener('click', callbacks.onClose);

  return {
    openExport: (json: string) => {
      textarea.value = json;
      dialog.hidden = false;
      textarea.focus();
    },
    openImport: () => {
      textarea.value = '';
      dialog.hidden = false;
      textarea.focus();
    },
    close: () => {
      dialog.hidden = true;
    },
  };
}
