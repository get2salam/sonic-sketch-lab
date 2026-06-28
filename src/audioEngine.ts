import type { SynthVoice, Step } from './synthModel.js';
import type { PatternGrid } from './sequencer.js';
import { midiToFreq, adsrSample } from './audioMath.js';

/** State of the audio engine. */
export type EngineStatus = 'idle' | 'running' | 'suspended' | 'unavailable';

/** Per-voice active note tracking. */
interface ActiveNote {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  startTime: number;
}

/**
 * Guarded Web Audio engine wrapper.
 * The AudioContext is created lazily on the first resume() call,
 * which requires a user gesture — safe per browser autoplay policy.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNotes = new Map<string, ActiveNote>();
  private _status: EngineStatus = 'unavailable';

  get status(): EngineStatus {
    return this._status;
  }

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** Called on first user gesture. Creates AudioContext and readies engine. */
  async resume(): Promise<void> {
    if (!this.ctx) {
      const Ctor =
        globalThis.AudioContext ??
        (globalThis as Record<string, typeof AudioContext>).webkitAudioContext;
      if (!Ctor) {
        this._status = 'unavailable';
        return;
      }
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this._status = 'running';
  }

  async suspend(): Promise<void> {
    if (this.ctx?.state === 'running') {
      await this.ctx.suspend();
      this._status = 'suspended';
    }
  }

  /** Trigger a note for the given voice at Web Audio currentTime + offset. */
  triggerNote(voice: SynthVoice, step: Step, timeOffset: number = 0): void {
    if (!this.ctx || !this.masterGain || !step) return;
    const startAt = this.ctx.currentTime + timeOffset;
    const freq = midiToFreq(step.midi + voice.oscillator.detune / 100 + voice.oscillator.octave * 12);
    const { attack, decay, sustain, release } = voice.envelope;
    const noteDuration = attack + decay + Math.max(sustain * 0.5, 0.1);
    const noteOff = startAt + noteDuration;

    const filter = this.ctx.createBiquadFilter();
    filter.type = voice.filter.type;
    filter.frequency.value = voice.filter.frequency;
    filter.Q.value = voice.filter.Q;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(voice.gain * (step.velocity / 127), startAt + attack);
    gainNode.gain.linearRampToValueAtTime(voice.gain * sustain, startAt + attack + decay);
    gainNode.gain.setValueAtTime(voice.gain * sustain, noteOff);
    gainNode.gain.linearRampToValueAtTime(0, noteOff + release);

    const osc = this.ctx.createOscillator();
    osc.type = voice.oscillator.type;
    osc.frequency.value = freq;
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    osc.start(startAt);
    osc.stop(noteOff + release + 0.01);

    const key = `${voice.id}-${startAt.toFixed(3)}`;
    const note: ActiveNote = { oscillator: osc, gainNode, filterNode: filter, startTime: startAt };
    this.activeNotes.set(key, note);
    osc.onended = () => this.activeNotes.delete(key);
  }

  /** Trigger all active steps for the current sequencer step. */
  triggerStep(grid: PatternGrid, voices: SynthVoice[], stepIndex: number): void {
    if (this._status !== 'running') return;
    for (const voice of voices) {
      if (voice.mute) continue;
      const row = grid.get(voice.id);
      if (!row) continue;
      const step = row[stepIndex];
      if (step) this.triggerNote(voice, step);
    }
  }

  /** Stop all currently playing notes immediately. */
  stopAll(): void {
    const now = this.ctx?.currentTime ?? 0;
    for (const note of this.activeNotes.values()) {
      try {
        note.gainNode.gain.cancelScheduledValues(now);
        note.gainNode.gain.setValueAtTime(0, now);
        note.oscillator.stop(now + 0.01);
      } catch {
        // already stopped
      }
    }
    this.activeNotes.clear();
  }

  /** Set master volume (0..1). */
  setMasterGain(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx!.currentTime, 0.01);
    }
  }

  async close(): Promise<void> {
    this.stopAll();
    await this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this._status = 'unavailable';
  }
}

/** Compute a deterministic waveform sample for offline use (no AudioContext). */
export function offlineSynthSample(midi: number, t: number, oscType: 'sine' | 'square' | 'sawtooth' | 'triangle'): number {
  const freq = midiToFreq(midi);
  const phase = (t * freq) % 1;
  switch (oscType) {
    case 'sine': return Math.sin(2 * Math.PI * phase);
    case 'square': return phase < 0.5 ? 1 : -1;
    case 'sawtooth': return 2 * phase - 1;
    case 'triangle': return 1 - 4 * Math.abs(phase - 0.5);
  }
}

/** Compute envelope-weighted offline sample (for visualizer). */
export function offlineVoiceSample(
  voice: Pick<SynthVoice, 'oscillator' | 'envelope' | 'gain'>,
  midi: number,
  t: number,
  noteOff: number,
): number {
  const env = adsrSample(t, voice.envelope.attack, voice.envelope.decay,
    voice.envelope.sustain, voice.envelope.release, noteOff);
  const raw = offlineSynthSample(midi, t, voice.oscillator.type as 'sine');
  return raw * env * voice.gain;
}
