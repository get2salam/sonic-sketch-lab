/** Convert MIDI note number to frequency in Hz (A4 = 440 Hz). */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Convert frequency in Hz to MIDI note number (fractional). */
export function freqToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

/** Convert BPM and subdivision to step duration in seconds. */
export function bpmToStepSeconds(bpm: number, subdivision: number = 16): number {
  return 60 / bpm / (subdivision / 4);
}

/** Linear amplitude to dBFS. Returns -Infinity for 0. */
export function ampToDb(amp: number): number {
  if (amp <= 0) return -Infinity;
  return 20 * Math.log10(amp);
}

/** dBFS to linear amplitude. */
export function dbToAmp(db: number): number {
  return Math.pow(10, db / 20);
}

/** Clamp a value between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation between a and b by t in [0, 1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Map a value from one range to another. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

/**
 * Compute an ADSR envelope sample at time t (seconds).
 * Returns amplitude in [0, 1].
 */
export function adsrSample(
  t: number,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  noteOff: number,
): number {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  const afterAttack = t - attack;
  if (afterAttack < decay) {
    return lerp(1, sustain, afterAttack / decay);
  }
  if (t < noteOff) return sustain;
  const rel = t - noteOff;
  if (rel < release) return sustain * (1 - rel / release);
  return 0;
}

/** Semitone offset to frequency ratio. */
export function semitonesToRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/** Round to a given number of decimal places. */
export function round(value: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}
