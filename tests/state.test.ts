import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeInitialState,
  validateSketch,
  exportSketch,
  importSketch,
  sketchToGrid,
  gridToSketch,
} from '../src/state.js';
import { setStep } from '../src/sequencer.js';

describe('makeInitialState', () => {
  it('returns an AppState with a valid sketch', () => {
    const s = makeInitialState();
    expect(validateSketch(s.sketch)).toBe(true);
  });

  it('transport starts at step 0, not playing', () => {
    const s = makeInitialState();
    expect(s.transport.playing).toBe(false);
    expect(s.transport.currentStep).toBe(0);
  });

  it('is not dirty initially', () => {
    expect(makeInitialState().dirty).toBe(false);
  });

  it('has an activePresetId', () => {
    const s = makeInitialState();
    expect(typeof s.activePresetId).toBe('string');
  });
});

describe('validateSketch', () => {
  let sketch: ReturnType<typeof makeInitialState>['sketch'];

  beforeEach(() => {
    sketch = makeInitialState().sketch;
  });

  it('accepts a valid default sketch', () => {
    expect(validateSketch(sketch)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateSketch(null)).toBe(false);
  });

  it('rejects sketch with empty id', () => {
    expect(validateSketch({ ...sketch, id: '' })).toBe(false);
  });

  it('rejects sketch with bpm out of range', () => {
    expect(validateSketch({ ...sketch, bpm: 10 })).toBe(false);
    expect(validateSketch({ ...sketch, bpm: 300 })).toBe(false);
  });

  it('rejects sketch with empty voices array', () => {
    expect(validateSketch({ ...sketch, voices: [] })).toBe(false);
  });

  it('rejects sketch with wrong version', () => {
    expect(validateSketch({ ...sketch, version: 2 })).toBe(false);
  });
});

describe('exportSketch / importSketch', () => {
  it('round-trips a sketch through JSON', () => {
    const orig = makeInitialState().sketch;
    const json = exportSketch(orig);
    const restored = importSketch(json);
    expect(restored.id).toBe(orig.id);
    expect(restored.bpm).toBe(orig.bpm);
    expect(restored.name).toBe(orig.name);
  });

  it('importSketch throws on invalid JSON', () => {
    expect(() => importSketch('not json')).toThrow();
  });

  it('importSketch throws on schema mismatch', () => {
    expect(() => importSketch('{"id":"x","version":1}')).toThrow();
  });
});

describe('sketchToGrid / gridToSketch', () => {
  it('sketchToGrid returns a Map with voice rows', () => {
    const { sketch } = makeInitialState();
    const grid = sketchToGrid(sketch);
    expect(grid instanceof Map).toBe(true);
    for (const voice of sketch.voices) {
      expect(grid.has(voice.id)).toBe(true);
    }
  });

  it('gridToSketch updates the grid record in the sketch', () => {
    const { sketch } = makeInitialState();
    const grid = sketchToGrid(sketch);
    const voiceId = sketch.voices[0].id;
    const updated = setStep(grid, voiceId, 7, { midi: 72, velocity: 90 });
    const newSketch = gridToSketch(sketch, updated);
    expect(newSketch.grid[voiceId][7]).toEqual({ midi: 72, velocity: 90 });
  });
});
