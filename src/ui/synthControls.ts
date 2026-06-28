import type { SynthVoice } from '../synthModel.js';

type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SynthControlCallbacks {
  onGainChange: (voiceId: string, gain: number) => void;
  onOscChange: (voiceId: string, type: OscType) => void;
  onEnvelopeChange: (voiceId: string, key: 'attack' | 'decay' | 'sustain' | 'release', value: number) => void;
  onFilterFreqChange: (voiceId: string, freq: number) => void;
}

function makeRange(
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'synth-param';
  wrap.innerHTML = `<label for="${id}">${label}: <span id="${id}-val">${value.toFixed(2)}</span></label>
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"
           aria-valuetext="${value.toFixed(2)}">`;
  return wrap;
}

function makeSelect(id: string, label: string, choices: string[], current: string): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'synth-param';
  const opts = choices.map((c) => `<option${c === current ? ' selected' : ''}>${c}</option>`).join('');
  wrap.innerHTML = `<label for="${id}">${label}</label><select id="${id}">${opts}</select>`;
  return wrap;
}

/** Render all voice synth controls into the given container. */
export function renderSynthControls(
  container: HTMLElement,
  voices: SynthVoice[],
  callbacks: SynthControlCallbacks,
): void {
  container.innerHTML = '';
  for (const voice of voices) {
    const section = document.createElement('fieldset');
    section.style.cssText =
      'border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:var(--space-3);grid-column:1/-1';
    section.innerHTML = `<legend style="font-size:var(--text-xs);font-family:var(--font-mono);color:var(--color-accent);padding:0 var(--space-2)">${voice.name}</legend>`;

    // Gain
    const gainId = `gain-${voice.id}`;
    const gainWrap = makeRange(gainId, 'Gain', 0, 1, 0.01, voice.gain);
    gainWrap.querySelector<HTMLInputElement>(`#${gainId}`)!.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      gainWrap.querySelector<HTMLElement>(`#${gainId}-val`)!.textContent = val.toFixed(2);
      callbacks.onGainChange(voice.id, val);
    });
    section.appendChild(gainWrap);

    // Waveform
    const oscId = `osc-${voice.id}`;
    const oscWrap = makeSelect(oscId, 'Waveform', ['sine', 'square', 'sawtooth', 'triangle'], voice.oscillator.type);
    oscWrap.querySelector<HTMLSelectElement>(`#${oscId}`)!.addEventListener('change', (e) => {
      callbacks.onOscChange(voice.id, (e.target as HTMLSelectElement).value as OscType);
    });
    section.appendChild(oscWrap);

    // Envelope: Attack, Decay, Sustain, Release
    for (const [key, min, max, step] of [
      ['attack', 0.001, 2, 0.001],
      ['decay', 0.001, 2, 0.001],
      ['sustain', 0, 1, 0.01],
      ['release', 0.001, 4, 0.001],
    ] as const) {
      const eid = `${key}-${voice.id}`;
      const envWrap = makeRange(eid, key[0].toUpperCase() + key.slice(1), min, max, step, voice.envelope[key]);
      envWrap.querySelector<HTMLInputElement>(`#${eid}`)!.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        envWrap.querySelector<HTMLElement>(`#${eid}-val`)!.textContent = val.toFixed(3);
        callbacks.onEnvelopeChange(voice.id, key, val);
      });
      section.appendChild(envWrap);
    }

    // Filter frequency
    const fid = `filter-${voice.id}`;
    const filterWrap = makeRange(fid, 'Filter Hz', 20, 20000, 1, voice.filter.frequency);
    filterWrap.querySelector<HTMLInputElement>(`#${fid}`)!.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      filterWrap.querySelector<HTMLElement>(`#${fid}-val`)!.textContent = val.toFixed(0);
      callbacks.onFilterFreqChange(voice.id, val);
    });
    section.appendChild(filterWrap);

    container.appendChild(section);
  }
}
