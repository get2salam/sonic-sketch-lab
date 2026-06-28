import { describe, it, expect } from 'vitest';
import {
  makeDefaultVoice,
  validateVoice,
  DEFAULT_ENVELOPE,
  DEFAULT_OSCILLATOR,
  DEFAULT_FILTER,
} from '../src/synthModel.js';

describe('makeDefaultVoice', () => {
  it('creates a voice with the given id and name', () => {
    const v = makeDefaultVoice('v1', 'Lead');
    expect(v.id).toBe('v1');
    expect(v.name).toBe('Lead');
  });

  it('uses default oscillator values', () => {
    const v = makeDefaultVoice('v1', 'Lead');
    expect(v.oscillator.type).toBe(DEFAULT_OSCILLATOR.type);
    expect(v.oscillator.detune).toBe(0);
    expect(v.oscillator.octave).toBe(0);
  });

  it('uses default envelope values', () => {
    const v = makeDefaultVoice('v1', 'Lead');
    expect(v.envelope.attack).toBe(DEFAULT_ENVELOPE.attack);
    expect(v.envelope.sustain).toBe(DEFAULT_ENVELOPE.sustain);
  });

  it('uses default filter values', () => {
    const v = makeDefaultVoice('v1', 'Lead');
    expect(v.filter.type).toBe(DEFAULT_FILTER.type);
    expect(v.filter.frequency).toBe(DEFAULT_FILTER.frequency);
  });

  it('sets gain to 0.7 by default', () => {
    const v = makeDefaultVoice('v1', 'Lead');
    expect(v.gain).toBe(0.7);
  });

  it('sets mute and solo to false', () => {
    const v = makeDefaultVoice('v1', 'Lead');
    expect(v.mute).toBe(false);
    expect(v.solo).toBe(false);
  });
});

describe('validateVoice', () => {
  it('accepts a valid default voice', () => {
    expect(validateVoice(makeDefaultVoice('v1', 'Lead'))).toBe(true);
  });

  it('rejects null', () => {
    expect(validateVoice(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(validateVoice('string')).toBe(false);
  });

  it('rejects voice with empty id', () => {
    const v = { ...makeDefaultVoice('v1', 'Lead'), id: '' };
    expect(validateVoice(v)).toBe(false);
  });

  it('rejects voice with out-of-range gain', () => {
    const v = { ...makeDefaultVoice('v1', 'Lead'), gain: 1.5 };
    expect(validateVoice(v)).toBe(false);
  });

  it('rejects voice with invalid oscillator type', () => {
    const v = makeDefaultVoice('v1', 'Lead');
    const bad = { ...v, oscillator: { ...v.oscillator, type: 'organ' } };
    expect(validateVoice(bad)).toBe(false);
  });

  it('rejects voice with non-boolean mute', () => {
    const v = { ...makeDefaultVoice('v1', 'Lead'), mute: 'no' };
    expect(validateVoice(v)).toBe(false);
  });

  it('accepts all valid oscillator types', () => {
    for (const type of ['sine', 'square', 'sawtooth', 'triangle'] as const) {
      const v = makeDefaultVoice('v1', 'Lead');
      v.oscillator.type = type;
      expect(validateVoice(v)).toBe(true);
    }
  });
});

describe('DEFAULT_ENVELOPE', () => {
  it('has attack, decay, sustain, release as numbers', () => {
    expect(typeof DEFAULT_ENVELOPE.attack).toBe('number');
    expect(typeof DEFAULT_ENVELOPE.decay).toBe('number');
    expect(typeof DEFAULT_ENVELOPE.sustain).toBe('number');
    expect(typeof DEFAULT_ENVELOPE.release).toBe('number');
  });

  it('has sustain in [0, 1]', () => {
    expect(DEFAULT_ENVELOPE.sustain).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_ENVELOPE.sustain).toBeLessThanOrEqual(1);
  });
});
