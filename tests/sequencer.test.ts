import { describe, it, expect } from 'vitest';
import {
  makePatternGrid,
  toggleStep,
  setStep,
  advanceStep,
  getActiveSteps,
  serializeGrid,
  deserializeGrid,
  makeTransport,
  getStepDuration,
  DEFAULT_STEPS,
  DEFAULT_BPM,
  MIN_BPM,
  MAX_BPM,
} from '../src/sequencer.js';
import { makeDefaultVoice } from '../src/synthModel.js';

const voices = [makeDefaultVoice('v1', 'A'), makeDefaultVoice('v2', 'B')];

describe('makePatternGrid', () => {
  it('creates a grid with one row per voice', () => {
    const g = makePatternGrid(voices);
    expect(g.size).toBe(2);
    expect(g.has('v1')).toBe(true);
    expect(g.has('v2')).toBe(true);
  });

  it('fills each row with nulls', () => {
    const g = makePatternGrid(voices);
    expect(g.get('v1')).toHaveLength(DEFAULT_STEPS);
    expect(g.get('v1')!.every((s) => s === null)).toBe(true);
  });

  it('respects custom step count', () => {
    const g = makePatternGrid(voices, 8);
    expect(g.get('v1')).toHaveLength(8);
  });
});

describe('toggleStep', () => {
  it('activates a null step to default midi 60, velocity 100', () => {
    const g = makePatternGrid(voices);
    const next = toggleStep(g, 'v1', 0);
    expect(next.get('v1')![0]).toEqual({ midi: 60, velocity: 100 });
  });

  it('deactivates an active step back to null', () => {
    const g = makePatternGrid(voices);
    const on = toggleStep(g, 'v1', 0);
    const off = toggleStep(on, 'v1', 0);
    expect(off.get('v1')![0]).toBeNull();
  });

  it('does not mutate the original grid', () => {
    const g = makePatternGrid(voices);
    toggleStep(g, 'v1', 0);
    expect(g.get('v1')![0]).toBeNull();
  });
});

describe('setStep', () => {
  it('sets a specific step note', () => {
    const g = makePatternGrid(voices);
    const next = setStep(g, 'v1', 3, { midi: 72, velocity: 90 });
    expect(next.get('v1')![3]).toEqual({ midi: 72, velocity: 90 });
  });

  it('can clear a step to null', () => {
    const g = makePatternGrid(voices);
    const on = setStep(g, 'v1', 0, { midi: 60, velocity: 100 });
    const cleared = setStep(on, 'v1', 0, null);
    expect(cleared.get('v1')![0]).toBeNull();
  });
});

describe('advanceStep', () => {
  it('increments currentStep by 1', () => {
    const t = makeTransport(120);
    const next = advanceStep(t);
    expect(next.currentStep).toBe(1);
  });

  it('wraps from last step back to 0', () => {
    const t = makeTransport(120);
    const last = { ...t, currentStep: DEFAULT_STEPS - 1 };
    expect(advanceStep(last).currentStep).toBe(0);
  });
});

describe('getActiveSteps', () => {
  it('returns only non-null steps', () => {
    const g = makePatternGrid(voices);
    const g2 = setStep(g, 'v1', 2, { midi: 60, velocity: 100 });
    const g3 = setStep(g2, 'v1', 5, { midi: 64, velocity: 80 });
    const active = getActiveSteps(g3, 'v1');
    expect(active).toHaveLength(2);
    expect(active[0].index).toBe(2);
    expect(active[1].index).toBe(5);
  });
});

describe('serializeGrid / deserializeGrid', () => {
  it('round-trips a grid with active steps', () => {
    const g = makePatternGrid(voices);
    const g2 = setStep(g, 'v1', 4, { midi: 69, velocity: 100 });
    const serialized = serializeGrid(g2);
    const restored = deserializeGrid(serialized);
    expect(restored.get('v1')![4]).toEqual({ midi: 69, velocity: 100 });
    expect(restored.get('v1')![0]).toBeNull();
  });
});

describe('makeTransport', () => {
  it('creates transport with given BPM', () => {
    const t = makeTransport(128);
    expect(t.bpm).toBe(128);
    expect(t.playing).toBe(false);
    expect(t.currentStep).toBe(0);
    expect(t.steps).toBe(DEFAULT_STEPS);
  });
});

describe('getStepDuration', () => {
  it('returns 0.125s at 120 bpm', () => {
    expect(getStepDuration(120)).toBeCloseTo(0.125, 5);
  });
});

describe('constants', () => {
  it('DEFAULT_STEPS is 16', () => { expect(DEFAULT_STEPS).toBe(16); });
  it('DEFAULT_BPM is 120', () => { expect(DEFAULT_BPM).toBe(120); });
  it('MIN_BPM is 40', () => { expect(MIN_BPM).toBe(40); });
  it('MAX_BPM is 240', () => { expect(MAX_BPM).toBe(240); });
});
