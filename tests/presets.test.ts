import { describe, it, expect } from 'vitest';
import { PRESETS, getPresetById, getPresetsByTag } from '../src/presets.js';
import { validateVoice } from '../src/synthModel.js';

describe('PRESETS', () => {
  it('has at least one preset', () => {
    expect(PRESETS.length).toBeGreaterThan(0);
  });

  it('each preset has required fields', () => {
    for (const p of PRESETS) {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.name).toBe('string');
      expect(typeof p.bpm).toBe('number');
      expect(p.bpm).toBeGreaterThanOrEqual(40);
      expect(p.bpm).toBeLessThanOrEqual(240);
      expect(Array.isArray(p.voices)).toBe(true);
      expect(p.voices.length).toBeGreaterThan(0);
      expect(p.grid).toBeDefined();
      expect(Array.isArray(p.tags)).toBe(true);
    }
  });

  it('preset ids are unique', () => {
    const ids = PRESETS.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('contains aurora-pluck, metro-bloom, and glass-tide', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(ids).toContain('aurora-pluck');
    expect(ids).toContain('metro-bloom');
    expect(ids).toContain('glass-tide');
  });

  it('grid keys match voice ids for each preset', () => {
    for (const p of PRESETS) {
      const voiceIds = new Set(p.voices.map((v) => v.id));
      for (const key of Object.keys(p.grid)) {
        expect(voiceIds.has(key)).toBe(true);
      }
    }
  });

  it('grid arrays have 16 steps each', () => {
    for (const p of PRESETS) {
      for (const steps of Object.values(p.grid)) {
        expect(steps).toHaveLength(16);
      }
    }
  });
});

describe('getPresetById', () => {
  it('returns the correct preset by id', () => {
    const p = getPresetById('aurora-pluck');
    expect(p).toBeDefined();
    expect(p!.id).toBe('aurora-pluck');
    expect(p!.name).toBe('Aurora Pluck');
  });

  it('returns undefined for unknown id', () => {
    expect(getPresetById('unknown-preset')).toBeUndefined();
  });
});

describe('getPresetsByTag', () => {
  it('returns presets matching a known tag', () => {
    const ambient = getPresetsByTag('ambient');
    expect(ambient.length).toBeGreaterThan(0);
    expect(ambient.every((p) => p.tags.includes('ambient'))).toBe(true);
  });

  it('returns empty array for an unknown tag', () => {
    expect(getPresetsByTag('nonexistent-tag-xyz')).toHaveLength(0);
  });

  it('returns a subset when the tag is not shared by all presets', () => {
    const rhythmic = getPresetsByTag('rhythmic');
    expect(rhythmic.length).toBeGreaterThan(0);
    expect(rhythmic.length).toBeLessThan(PRESETS.length);
  });

  it('every returned preset actually contains the requested tag', () => {
    for (const tag of ['ambient', 'minimal', 'electronic', 'pulse']) {
      const results = getPresetsByTag(tag);
      for (const p of results) {
        expect(p.tags).toContain(tag);
      }
    }
  });
});

describe('preset data integrity', () => {
  it('all preset voices pass validateVoice', () => {
    for (const p of PRESETS) {
      for (const v of p.voices) {
        expect(validateVoice(v)).toBe(true);
      }
    }
  });

  it('all active step MIDI notes are in valid range [0, 127]', () => {
    for (const p of PRESETS) {
      for (const steps of Object.values(p.grid)) {
        for (const step of steps) {
          if (step !== null) {
            expect(step.midi).toBeGreaterThanOrEqual(0);
            expect(step.midi).toBeLessThanOrEqual(127);
          }
        }
      }
    }
  });

  it('all active step velocities are in valid range [1, 127]', () => {
    for (const p of PRESETS) {
      for (const steps of Object.values(p.grid)) {
        for (const step of steps) {
          if (step !== null) {
            expect(step.velocity).toBeGreaterThanOrEqual(1);
            expect(step.velocity).toBeLessThanOrEqual(127);
          }
        }
      }
    }
  });

  it('all preset voice gain values are in [0, 1]', () => {
    for (const p of PRESETS) {
      for (const v of p.voices) {
        expect(v.gain).toBeGreaterThanOrEqual(0);
        expect(v.gain).toBeLessThanOrEqual(1);
      }
    }
  });
});
