import { describe, it, expect } from 'vitest';
import { PRESETS, getPresetById } from '../src/presets.js';

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
