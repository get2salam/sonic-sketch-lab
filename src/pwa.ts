/** PWA installation prompt event (non-standard, Chrome/Edge). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

/** Register the service worker at /sw.js (no-op if unsupported). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('[PWA] Service worker registration failed:', err);
    return null;
  }
}

/** Listen for the install prompt and store it for later use. */
export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
  });
}

/** Show the deferred install prompt if available. Returns true if shown. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  await deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return choice.outcome === 'accepted';
}

/** True if the deferred install prompt is available. */
export function canInstall(): boolean {
  return deferredInstallPrompt !== null;
}

/** Initialize PWA features after DOMContentLoaded. */
export async function initPwa(): Promise<void> {
  listenForInstallPrompt();
  await registerServiceWorker();
}
