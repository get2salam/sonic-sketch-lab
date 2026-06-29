import { describe, it, expect } from 'vitest';
import {
  midiToFreq,
  freqToMidi,
  bpmToStepSeconds,
  ampToDb,
  dbToAmp,
  clamp,
  lerp,
  mapRange,
  adsrSample,
  semitonesToRatio,
  round,
} from '../src/audioMath.js';

describe('midiToFreq', () => {
  it('returns 440 Hz for MIDI 69 (A4)', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
  });
  it('returns 261.63 Hz for MIDI 60 (C4)', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.626, 2);
  });
  it('doubles frequency per octave', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 3);
  });
});

describe('freqToMidi', () => {
  it('returns 69 for 440 Hz', () => {
    expect(freqToMidi(440)).toBeCloseTo(69, 5);
  });
  it('round-trips with midiToFreq', () => {
    for (const midi of [36, 48, 60, 72, 84]) {
      expect(freqToMidi(midiToFreq(midi))).toBeCloseTo(midi, 5);
    }
  });
});

describe('bpmToStepSeconds', () => {
  it('returns 0.125s at 120 bpm, 16 steps', () => {
    expect(bpmToStepSeconds(120, 16)).toBeCloseTo(0.125, 5);
  });
  it('returns 0.5s at 60 bpm, 8 steps', () => {
    expect(bpmToStepSeconds(60, 8)).toBeCloseTo(0.5, 5);
  });
  it('uses 16 as the default subdivision', () => {
    expect(bpmToStepSeconds(120)).toBeCloseTo(bpmToStepSeconds(120, 16), 10);
  });
  it('scales inversely with BPM', () => {
    expect(bpmToStepSeconds(240, 16)).toBeCloseTo(bpmToStepSeconds(120, 16) / 2, 5);
  });
});

describe('ampToDb / dbToAmp', () => {
  it('ampToDb returns 0 for amp=1', () => {
    expect(ampToDb(1)).toBeCloseTo(0, 5);
  });
  it('ampToDb returns -Infinity for amp=0', () => {
    expect(ampToDb(0)).toBe(-Infinity);
  });
  it('dbToAmp round-trips with ampToDb', () => {
    expect(dbToAmp(ampToDb(0.5))).toBeCloseTo(0.5, 5);
  });
  it('dbToAmp(0) returns 1', () => {
    expect(dbToAmp(0)).toBeCloseTo(1, 5);
  });
});

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-1, 0, 1)).toBe(0));
  it('clamps above max', () => expect(clamp(2, 0, 1)).toBe(1));
  it('passes through in-range values', () => expect(clamp(0.5, 0, 1)).toBe(0.5));
});

describe('lerp', () => {
  it('returns a at t=0', () => expect(lerp(0, 10, 0)).toBe(0));
  it('returns b at t=1', () => expect(lerp(0, 10, 1)).toBe(10));
  it('returns midpoint at t=0.5', () => expect(lerp(0, 10, 0.5)).toBe(5));
  it('clamps t above 1', () => expect(lerp(0, 10, 2)).toBe(10));
  it('clamps t below 0', () => expect(lerp(0, 10, -1)).toBe(0));
});

describe('mapRange', () => {
  it('maps 0.5 from [0,1] to [0,100]', () => {
    expect(mapRange(0.5, 0, 1, 0, 100)).toBeCloseTo(50, 5);
  });

  it('maps value below inMin (extrapolation clamps to outMin)', () => {
    // t = (−0.5 − 0) / (1 − 0) = −0.5; lerp clamps t to 0 → outMin
    expect(mapRange(-0.5, 0, 1, 0, 100)).toBeCloseTo(0, 5);
  });

  it('maps value above inMax (extrapolation clamps to outMax)', () => {
    // t = (1.5 − 0) / (1 − 0) = 1.5; lerp clamps t to 1 → outMax
    expect(mapRange(1.5, 0, 1, 0, 100)).toBeCloseTo(100, 5);
  });

  it('returns outMin (not NaN) for degenerate zero-width input range', () => {
    // Without the guard, (value − inMin) / (inMin − inMin) = 0/0 = NaN
    const result = mapRange(5, 5, 5, 10, 20);
    expect(result).toBe(10);
    expect(Number.isNaN(result)).toBe(false);
  });

  it('maps the full inMax value to outMax', () => {
    expect(mapRange(1, 0, 1, 0, 100)).toBeCloseTo(100, 5);
  });
});

describe('adsrSample', () => {
  it('returns 0 before note starts', () => expect(adsrSample(-0.1, 0.01, 0.1, 0.5, 0.2, 0.5)).toBe(0));
  it('peaks at attack end', () => {
    expect(adsrSample(0.01, 0.01, 0.1, 0.5, 0.2, 0.5)).toBeCloseTo(1, 2);
  });
  it('returns 0 after full release', () => {
    expect(adsrSample(2, 0.01, 0.1, 0.5, 0.2, 0.5)).toBe(0);
  });
  it('holds sustain level during sustain phase', () => {
    expect(adsrSample(0.3, 0.01, 0.1, 0.5, 0.2, 0.5)).toBeCloseTo(0.5, 2);
  });
});

describe('semitonesToRatio', () => {
  it('returns 2 for 12 semitones (one octave)', () => {
    expect(semitonesToRatio(12)).toBeCloseTo(2, 5);
  });
  it('returns 1 for 0 semitones', () => {
    expect(semitonesToRatio(0)).toBeCloseTo(1, 5);
  });
});

describe('round', () => {
  it('rounds to 2 decimal places', () => {
    expect(round(1.2345, 2)).toBe(1.23);
  });
  it('rounds to 0 decimal places', () => {
    expect(round(1.6, 0)).toBe(2);
  });
});
