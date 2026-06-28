import type { SynthVoice, Step } from './synthModel.js';

/** A complete named sketch that can be loaded into the app. */
export interface SketchPreset {
  id: string;
  name: string;
  description: string;
  bpm: number;
  voices: SynthVoice[];
  grid: Record<string, Step[]>;
  tags: string[];
}

const AURORA_PLUCK: SketchPreset = {
  id: 'aurora-pluck',
  name: 'Aurora Pluck',
  description: 'Shimmering plucked arpeggios with a soft filter sweep, evoking northern lights.',
  bpm: 96,
  voices: [
    {
      id: 'v1',
      name: 'Lead Pluck',
      oscillator: { type: 'triangle', detune: 5, octave: 1 },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.1, release: 0.5 },
      filter: { type: 'lowpass', frequency: 3200, Q: 2, gain: 0 },
      gain: 0.65,
      mute: false,
      solo: false,
    },
    {
      id: 'v2',
      name: 'Sub Pad',
      oscillator: { type: 'sine', detune: 0, octave: -1 },
      envelope: { attack: 0.3, decay: 0.5, sustain: 0.7, release: 1.2 },
      filter: { type: 'lowpass', frequency: 600, Q: 0.7, gain: 0 },
      gain: 0.45,
      mute: false,
      solo: false,
    },
  ],
  grid: {
    v1: [
      { midi: 69, velocity: 100 }, null, { midi: 72, velocity: 85 }, null,
      { midi: 76, velocity: 90 }, null, { midi: 72, velocity: 80 }, null,
      { midi: 74, velocity: 95 }, null, { midi: 69, velocity: 80 }, null,
      { midi: 71, velocity: 90 }, null, { midi: 74, velocity: 85 }, null,
    ],
    v2: [
      { midi: 45, velocity: 80 }, null, null, null,
      { midi: 45, velocity: 70 }, null, null, null,
      { midi: 47, velocity: 75 }, null, null, null,
      { midi: 45, velocity: 80 }, null, null, null,
    ],
  },
  tags: ['ambient', 'arpeggio', 'soft'],
};

const METRO_BLOOM: SketchPreset = {
  id: 'metro-bloom',
  name: 'Metro Bloom',
  description: 'Punchy rhythmic pulse with blooming filter resonance, urban and forward-moving.',
  bpm: 128,
  voices: [
    {
      id: 'v1',
      name: 'Kick Pulse',
      oscillator: { type: 'sine', detune: 0, octave: -2 },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
      filter: { type: 'lowpass', frequency: 200, Q: 1, gain: 0 },
      gain: 0.9,
      mute: false,
      solo: false,
    },
    {
      id: 'v2',
      name: 'Hi Pulse',
      oscillator: { type: 'square', detune: 0, octave: 2 },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
      filter: { type: 'highpass', frequency: 5000, Q: 1.5, gain: 0 },
      gain: 0.5,
      mute: false,
      solo: false,
    },
    {
      id: 'v3',
      name: 'Bloom Lead',
      oscillator: { type: 'sawtooth', detune: 10, octave: 0 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
      filter: { type: 'bandpass', frequency: 1200, Q: 4, gain: 0 },
      gain: 0.6,
      mute: false,
      solo: false,
    },
  ],
  grid: {
    v1: [
      { midi: 36, velocity: 127 }, null, null, null,
      { midi: 36, velocity: 100 }, null, null, null,
      { midi: 36, velocity: 127 }, null, null, null,
      { midi: 36, velocity: 110 }, null, { midi: 36, velocity: 90 }, null,
    ],
    v2: [
      null, null, null, null,
      null, null, { midi: 84, velocity: 90 }, null,
      null, null, null, null,
      null, null, { midi: 84, velocity: 80 }, null,
    ],
    v3: [
      null, null, { midi: 62, velocity: 85 }, null,
      { midi: 65, velocity: 90 }, null, null, null,
      null, null, { midi: 67, velocity: 95 }, null,
      { midi: 65, velocity: 85 }, null, null, null,
    ],
  },
  tags: ['rhythmic', 'electronic', 'pulse'],
};

const GLASS_TIDE: SketchPreset = {
  id: 'glass-tide',
  name: 'Glass Tide',
  description: 'Crystalline, slowly evolving harmonic pattern with minimal rhythmic variation.',
  bpm: 80,
  voices: [
    {
      id: 'v1',
      name: 'Crystal High',
      oscillator: { type: 'triangle', detune: 2, octave: 2 },
      envelope: { attack: 0.1, decay: 0.6, sustain: 0.5, release: 1.5 },
      filter: { type: 'lowpass', frequency: 8000, Q: 0.5, gain: 0 },
      gain: 0.55,
      mute: false,
      solo: false,
    },
    {
      id: 'v2',
      name: 'Crystal Mid',
      oscillator: { type: 'triangle', detune: -2, octave: 0 },
      envelope: { attack: 0.2, decay: 0.8, sustain: 0.6, release: 2.0 },
      filter: { type: 'lowpass', frequency: 4000, Q: 0.7, gain: 0 },
      gain: 0.5,
      mute: false,
      solo: false,
    },
    {
      id: 'v3',
      name: 'Tide Bass',
      oscillator: { type: 'sine', detune: 0, octave: -1 },
      envelope: { attack: 0.5, decay: 1.0, sustain: 0.8, release: 3.0 },
      filter: { type: 'lowpass', frequency: 400, Q: 1, gain: 0 },
      gain: 0.6,
      mute: false,
      solo: false,
    },
  ],
  grid: {
    v1: [
      { midi: 76, velocity: 75 }, null, null, null,
      { midi: 79, velocity: 70 }, null, null, null,
      { midi: 83, velocity: 75 }, null, null, null,
      { midi: 81, velocity: 70 }, null, null, null,
    ],
    v2: [
      { midi: 64, velocity: 70 }, null, null, null,
      null, null, null, null,
      { midi: 67, velocity: 65 }, null, null, null,
      null, null, null, null,
    ],
    v3: [
      { midi: 40, velocity: 80 }, null, null, null,
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
    ],
  },
  tags: ['ambient', 'minimal', 'evolving'],
};

export const PRESETS: readonly SketchPreset[] = [
  AURORA_PLUCK,
  METRO_BLOOM,
  GLASS_TIDE,
];

export function getPresetById(id: string): SketchPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function getPresetsByTag(tag: string): SketchPreset[] {
  return PRESETS.filter((p) => p.tags.includes(tag));
}
