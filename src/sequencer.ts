import type { Step, SynthVoice } from './synthModel.js';
import { bpmToStepSeconds } from './audioMath.js';

export const DEFAULT_STEPS = 16;
export const DEFAULT_BPM = 120;
export const MIN_BPM = 40;
export const MAX_BPM = 240;

/** A pattern is a grid of steps: voiceId -> Step[]. */
export type PatternGrid = Map<string, Step[]>;

/** Transport state. */
export interface TransportState {
  playing: boolean;
  currentStep: number;
  bpm: number;
  steps: number;
}

/** Create an empty pattern grid for the given voices. */
export function makePatternGrid(voices: SynthVoice[], steps: number = DEFAULT_STEPS): PatternGrid {
  const grid: PatternGrid = new Map();
  for (const v of voices) {
    grid.set(v.id, new Array<Step>(steps).fill(null));
  }
  return grid;
}

/** Toggle a step on/off; if off (null), set to defaultNote; if on, clear to null. */
export function toggleStep(
  grid: PatternGrid,
  voiceId: string,
  stepIndex: number,
  defaultMidi: number = 60,
  defaultVelocity: number = 100,
): PatternGrid {
  const next = new Map(grid);
  const row = [...(next.get(voiceId) ?? [])];
  if (row[stepIndex] === null || row[stepIndex] === undefined) {
    row[stepIndex] = { midi: defaultMidi, velocity: defaultVelocity };
  } else {
    row[stepIndex] = null;
  }
  next.set(voiceId, row);
  return next;
}

/** Set a step to a specific note. */
export function setStep(
  grid: PatternGrid,
  voiceId: string,
  stepIndex: number,
  step: Step,
): PatternGrid {
  const next = new Map(grid);
  const row = [...(next.get(voiceId) ?? [])];
  row[stepIndex] = step;
  next.set(voiceId, row);
  return next;
}

/** Advance transport to next step, wrapping at grid length. */
export function advanceStep(state: TransportState): TransportState {
  return {
    ...state,
    currentStep: (state.currentStep + 1) % state.steps,
  };
}

/** Get active steps for a given voice (non-null entries). */
export function getActiveSteps(grid: PatternGrid, voiceId: string): Array<{ index: number; step: Step }> {
  const row = grid.get(voiceId) ?? [];
  return row
    .map((step, index) => ({ index, step }))
    .filter(({ step }) => step !== null);
}

/** Serialize a PatternGrid to a plain object for JSON export. */
export function serializeGrid(grid: PatternGrid): Record<string, Step[]> {
  const out: Record<string, Step[]> = {};
  for (const [k, v] of grid.entries()) {
    out[k] = v;
  }
  return out;
}

/** Deserialize a plain object back to a PatternGrid. */
export function deserializeGrid(raw: Record<string, Step[]>): PatternGrid {
  const grid: PatternGrid = new Map();
  for (const [k, v] of Object.entries(raw)) {
    grid.set(k, v);
  }
  return grid;
}

/** Get the step duration for the current BPM. */
export function getStepDuration(bpm: number): number {
  return bpmToStepSeconds(bpm, DEFAULT_STEPS);
}

/** Create default transport state. */
export function makeTransport(bpm: number = DEFAULT_BPM): TransportState {
  return {
    playing: false,
    currentStep: 0,
    bpm,
    steps: DEFAULT_STEPS,
  };
}
