import { describe, it, expect } from 'vitest';
import {
  generateWaveform,
  mixWaveforms,
  rmsAmplitude,
  peakAmplitude,
  downsample,
  stepBarHeights,
} from '../src/visualizer.js';
import { makeDefaultVoice } from '../src/synthModel.js';
import { makePatternGrid, setStep } from '../src/sequencer.js';

const voice = makeDefaultVoice('v1', 'Lead');

describe('generateWaveform', () => {
  it('returns an array of WaveformPoints', () => {
    const pts = generateWaveform(voice, 60);
    expect(Array.isArray(pts)).toBe(true);
    expect(pts.length).toBeGreaterThan(0);
  });

  it('each point has t and amplitude', () => {
    const pts = generateWaveform(voice, 60, { durationSeconds: 0.1, sampleRate: 10 });
    for (const p of pts) {
      expect(typeof p.t).toBe('number');
      expect(typeof p.amplitude).toBe('number');
    }
  });

  it('amplitude stays in [-1, 1]', () => {
    const pts = generateWaveform(voice, 60);
    for (const p of pts) {
      expect(p.amplitude).toBeGreaterThanOrEqual(-1);
      expect(p.amplitude).toBeLessThanOrEqual(1);
    }
  });

  it('t starts at 0', () => {
    const pts = generateWaveform(voice, 60);
    expect(pts[0].t).toBe(0);
  });
});

describe('mixWaveforms', () => {
  it('returns silence when no active steps', () => {
    const pts = mixWaveforms([], [], { durationSeconds: 0.1, sampleRate: 10 });
    expect(pts.every((p) => p.amplitude === 0)).toBe(true);
  });

  it('mixes a single step', () => {
    const step = { midi: 60, velocity: 100 };
    const pts = mixWaveforms([voice], [{ voice, step }], { durationSeconds: 0.1, sampleRate: 10 });
    expect(pts.length).toBeGreaterThan(0);
  });
});

describe('rmsAmplitude', () => {
  it('returns 0 for empty array', () => {
    expect(rmsAmplitude([])).toBe(0);
  });

  it('returns 0 for all-zero waveform', () => {
    const pts = [{ t: 0, amplitude: 0 }, { t: 0.1, amplitude: 0 }];
    expect(rmsAmplitude(pts)).toBe(0);
  });

  it('returns positive value for non-zero waveform', () => {
    const pts = generateWaveform(voice, 60, { durationSeconds: 0.2, sampleRate: 50 });
    expect(rmsAmplitude(pts)).toBeGreaterThanOrEqual(0);
  });
});

describe('peakAmplitude', () => {
  it('returns 0 for all-zero waveform', () => {
    const pts = [{ t: 0, amplitude: 0 }];
    expect(peakAmplitude(pts)).toBe(0);
  });

  it('returns absolute max amplitude', () => {
    const pts = [
      { t: 0, amplitude: 0.3 },
      { t: 0.1, amplitude: -0.7 },
      { t: 0.2, amplitude: 0.5 },
    ];
    expect(peakAmplitude(pts)).toBeCloseTo(0.7, 5);
  });
});

describe('downsample', () => {
  it('returns the same array if already at or below target', () => {
    const pts = [{ t: 0, amplitude: 0.5 }, { t: 1, amplitude: -0.5 }];
    expect(downsample(pts, 5)).toHaveLength(2);
  });

  it('downsamples to exactly targetPoints entries', () => {
    const pts = generateWaveform(voice, 60, { durationSeconds: 1, sampleRate: 200 });
    const ds = downsample(pts, 50);
    expect(ds).toHaveLength(50);
  });
});

describe('stepBarHeights', () => {
  it('returns an array of length stepCount', () => {
    const voices = [voice];
    const grid = makePatternGrid(voices);
    const bars = stepBarHeights(voices, grid, 16);
    expect(bars).toHaveLength(16);
  });

  it('all bars are 0 for empty grid', () => {
    const voices = [voice];
    const grid = makePatternGrid(voices);
    const bars = stepBarHeights(voices, grid, 16);
    expect(bars.every((b) => b === 0)).toBe(true);
  });

  it('active step produces non-zero bar', () => {
    const voices = [voice];
    const grid = makePatternGrid(voices);
    const g2 = setStep(grid, 'v1', 4, { midi: 60, velocity: 100 });
    const bars = stepBarHeights(voices, g2, 16);
    expect(bars[4]).toBeGreaterThan(0);
  });
});
