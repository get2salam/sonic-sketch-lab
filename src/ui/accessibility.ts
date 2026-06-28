let _announcer: HTMLElement | null = null;

/** Attach the live-region element used by announce(). Call once at init. */
export function initAnnouncer(el: HTMLElement): void {
  _announcer = el;
}

/** Post a polite ARIA announcement; clears first so repeated identical strings trigger. */
export function announce(msg: string): void {
  if (!_announcer) return;
  _announcer.textContent = '';
  requestAnimationFrame(() => {
    if (_announcer) _announcer.textContent = msg;
  });
}

/** Toggle aria-pressed on a button element. */
export function setAriaPressed(btn: HTMLElement, pressed: boolean): void {
  btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
}

/** Toggle aria-selected on a listbox option or similar element. */
export function setAriaSelected(el: HTMLElement, selected: boolean): void {
  el.setAttribute('aria-selected', selected ? 'true' : 'false');
}

/** Focus an element and optionally scroll it into view. */
export function focusElement(el: HTMLElement, scroll = false): void {
  el.focus({ preventScroll: !scroll });
}

/** Return true if the user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
