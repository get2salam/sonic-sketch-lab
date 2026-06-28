import type { SynthVoice, Step } from './synthModel.js';
import { offlineVoiceSample } from './audioEngine.js';
import { midiToFreq } from './audioMath.js';

/** A single waveform data point. */
export interface WaveformPoint {
  t: number;
  amplitude: number;
}

/** Options for waveform data generation. */
export interface WaveformOptions {
  durationSeconds: number;
  sampleRate: number;
  noteOff: number;
}

const DEFAULT_WAVEFORM_OPTIONS: WaveformOptions = {
  durationSeconds: 1.0,
  sampleRate: 200,
  noteOff: 0.5,
};

/**
 * Generate deterministic waveform data for a voice+step pair.
 * Uses offlineVoiceSample — no AudioContext needed.
 */
export function generateWaveform(
  voice: Pick<SynthVoice, 'oscillator' | 'envelope' | 'gain'>,
  midi: number,
  opts: Partial<WaveformOptions> = {},
): WaveformPoint[] {
  const { durationSeconds, sampleRate, noteOff } = { ...DEFAULT_WAVEFORM_OPTIONS, ...opts };
  const totalSamples = Math.round(durationSeconds * sampleRate);
  const points: WaveformPoint[] = [];
  for (let i = 0; i <= totalSamples; i++) {
    const t = i / sampleRate;
    points.push({ t, amplitude: offlineVoiceSample(voice, midi, t, noteOff) });
  }
  return points;
}

/**
 * Mix waveforms for multiple active steps (sum, then clip to [-1, 1]).
 */
export function mixWaveforms(
  voices: SynthVoice[],
  activeSteps: Array<{ voice: SynthVoice; step: Step }>,
  opts: Partial<WaveformOptions> = {},
): WaveformPoint[] {
  if (activeSteps.length === 0) {
    const { durationSeconds, sampleRate } = { ...DEFAULT_WAVEFORM_OPTIONS, ...opts };
    const n = Math.round(durationSeconds * sampleRate);
    return Array.from({ length: n + 1 }, (_, i) => ({ t: i / sampleRate, amplitude: 0 }));
  }
  const resolved = { ...DEFAULT_WAVEFORM_OPTIONS, ...opts };
  const channels = activeSteps.map(({ voice, step }) =>
    step ? generateWaveform(voice, step.midi, resolved) : [],
  );
  const len = channels[0].length;
  return Array.from({ length: len }, (_, i) => {
    const t = channels[0][i].t;
    let sum = 0;
    for (const ch of channels) {
      sum += ch[i]?.amplitude ?? 0;
    }
    return { t, amplitude: Math.max(-1, Math.min(1, sum / Math.max(1, activeSteps.length))) };
  });
}

/** Compute RMS amplitude of a waveform. */
export function rmsAmplitude(points: WaveformPoint[]): number {
  if (points.length === 0) return 0;
  const sumSq = points.reduce((acc, p) => acc + p.amplitude * p.amplitude, 0);
  return Math.sqrt(sumSq / points.length);
}

/** Find peak amplitude in a waveform. */
export function peakAmplitude(points: WaveformPoint[]): number {
  return points.reduce((max, p) => Math.max(max, Math.abs(p.amplitude)), 0);
}

/** Downsample a waveform to a fixed number of points for display. */
export function downsample(points: WaveformPoint[], targetPoints: number): WaveformPoint[] {
  if (points.length <= targetPoints) return points;
  const ratio = points.length / targetPoints;
  return Array.from({ length: targetPoints }, (_, i) => {
    const idx = Math.min(Math.round(i * ratio), points.length - 1);
    return points[idx];
  });
}

/** Compute grid-scale peak per-step for a visualizer bar display. */
export function stepBarHeights(
  voices: SynthVoice[],
  grid: Map<string, Step[]>,
  steps: number,
): number[] {
  return Array.from({ length: steps }, (_, stepIdx) => {
    let peak = 0;
    for (const voice of voices) {
      const row = grid.get(voice.id);
      if (!row) continue;
      const step = row[stepIdx];
      if (!step) continue;
      const wv = generateWaveform(voice, step.midi, { durationSeconds: 0.05, sampleRate: 50 });
      peak = Math.max(peak, peakAmplitude(wv) * voice.gain);
    }
    return peak;
  });
}
