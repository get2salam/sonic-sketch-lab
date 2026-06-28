/** Oscillator waveform types supported by Web Audio. */
export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** Filter types. */
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

/** ADSR envelope parameters (all durations in seconds). */
export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/** Synth voice oscillator parameters. */
export interface OscillatorParams {
  type: OscillatorType;
  detune: number;
  octave: number;
}

/** Filter parameters. */
export interface FilterParams {
  type: FilterType;
  frequency: number;
  Q: number;
  gain: number;
}

/** Complete parameters for a single synth voice. */
export interface SynthVoice {
  id: string;
  name: string;
  oscillator: OscillatorParams;
  envelope: Envelope;
  filter: FilterParams;
  gain: number;
  mute: boolean;
  solo: boolean;
}

/** A single step note in a pattern. null means rest. */
export interface StepNote {
  midi: number;
  velocity: number;
}

/** A single step in the sequencer (per voice). */
export type Step = StepNote | null;

export const DEFAULT_ENVELOPE: Envelope = {
  attack: 0.01,
  decay: 0.15,
  sustain: 0.6,
  release: 0.2,
};

export const DEFAULT_OSCILLATOR: OscillatorParams = {
  type: 'triangle',
  detune: 0,
  octave: 0,
};

export const DEFAULT_FILTER: FilterParams = {
  type: 'lowpass',
  frequency: 4000,
  Q: 1,
  gain: 0,
};

export function makeDefaultVoice(id: string, name: string): SynthVoice {
  return {
    id,
    name,
    oscillator: { ...DEFAULT_OSCILLATOR },
    envelope: { ...DEFAULT_ENVELOPE },
    filter: { ...DEFAULT_FILTER },
    gain: 0.7,
    mute: false,
    solo: false,
  };
}

/** Validate that a voice object has all required fields within bounds. */
export function validateVoice(v: unknown): v is SynthVoice {
  if (!v || typeof v !== 'object') return false;
  const voice = v as Record<string, unknown>;
  if (typeof voice.id !== 'string' || voice.id.length === 0) return false;
  if (typeof voice.name !== 'string') return false;
  if (typeof voice.gain !== 'number' || voice.gain < 0 || voice.gain > 1) return false;
  if (typeof voice.mute !== 'boolean') return false;
  if (typeof voice.solo !== 'boolean') return false;
  const osc = voice.oscillator as Record<string, unknown>;
  if (!osc || !['sine', 'square', 'sawtooth', 'triangle'].includes(osc.type as string)) return false;
  const env = voice.envelope as Record<string, unknown>;
  if (!env || typeof env.attack !== 'number' || typeof env.decay !== 'number') return false;
  if (typeof env.sustain !== 'number' || typeof env.release !== 'number') return false;
  return true;
}
