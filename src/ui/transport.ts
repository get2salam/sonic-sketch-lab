import { MIN_BPM, MAX_BPM } from '../sequencer.js';

export interface TransportCallbacks {
  onTogglePlay: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
}

/** Wire play/stop buttons and BPM input to their callbacks. */
export function initTransportControls(
  playBtn: HTMLButtonElement,
  stopBtn: HTMLButtonElement,
  bpmInput: HTMLInputElement,
  callbacks: TransportCallbacks,
): void {
  playBtn.addEventListener('click', callbacks.onTogglePlay);
  stopBtn.addEventListener('click', callbacks.onStop);
  bpmInput.addEventListener('change', () => {
    const bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, parseInt(bpmInput.value, 10) || MIN_BPM));
    bpmInput.value = String(bpm);
    callbacks.onBpmChange(bpm);
  });
}

/** Sync transport button/display state to current playback state. */
export function syncTransportUI(
  playBtn: HTMLButtonElement,
  stepDisplay: HTMLElement,
  playing: boolean,
  currentStep: number,
  totalSteps: number,
): void {
  playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  stepDisplay.textContent = playing ? `Step ${currentStep + 1}/${totalSteps}` : '';
}

/** Update BPM input to reflect a new value (e.g. after preset load). */
export function syncBpmInput(bpmInput: HTMLInputElement, bpm: number): void {
  bpmInput.value = String(bpm);
}
