/** Results of feature detection for runtime adaptation. */
export interface CapabilityReport {
  webAudio: boolean;
  audioWorklet: boolean;
  serviceWorker: boolean;
  localStorage: boolean;
  canvas: boolean;
  pointerEvents: boolean;
  reducedMotion: boolean;
}

/** Detect available browser capabilities without starting any audio. */
export function detectCapabilities(): CapabilityReport {
  const webAudio =
    typeof globalThis.AudioContext !== 'undefined' ||
    typeof (globalThis as Record<string, unknown>).webkitAudioContext !== 'undefined';

  const audioWorklet =
    webAudio &&
    typeof globalThis.AudioContext !== 'undefined' &&
    typeof AudioContext.prototype.audioWorklet !== 'undefined';

  const serviceWorker = 'serviceWorker' in navigator;

  let localStorageAvailable = false;
  try {
    const key = '__ssl_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    localStorageAvailable = true;
  } catch {
    localStorageAvailable = false;
  }

  const canvas = (() => {
    try {
      const el = document.createElement('canvas');
      return typeof el.getContext === 'function';
    } catch {
      return false;
    }
  })();

  const pointerEvents = 'PointerEvent' in globalThis;

  const reducedMotion =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    webAudio,
    audioWorklet,
    serviceWorker,
    localStorage: localStorageAvailable,
    canvas,
    pointerEvents,
    reducedMotion,
  };
}

/** Return a human-readable summary of capability gaps. */
export function describeGaps(report: CapabilityReport): string[] {
  const gaps: string[] = [];
  if (!report.webAudio) gaps.push('Web Audio API not available — audio playback disabled');
  if (!report.serviceWorker) gaps.push('Service Worker not supported — offline mode unavailable');
  if (!report.localStorage) gaps.push('localStorage not available — sketches will not persist');
  if (!report.canvas) gaps.push('Canvas not available — visualizer disabled');
  return gaps;
}
