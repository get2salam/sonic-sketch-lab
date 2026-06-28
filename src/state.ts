import type { SynthVoice, Step } from './synthModel.js';
import type { TransportState } from './sequencer.js';
import { makeTransport, makePatternGrid, serializeGrid, deserializeGrid } from './sequencer.js';
import { PRESETS } from './presets.js';

const STORAGE_KEY = 'sonic-sketch-lab:sketch';

/** The complete application sketch that can be persisted. */
export interface SketchState {
  id: string;
  name: string;
  bpm: number;
  voices: SynthVoice[];
  grid: Record<string, Step[]>;
  version: 1;
}

/** Full runtime application state. */
export interface AppState {
  sketch: SketchState;
  transport: TransportState;
  activePresetId: string | null;
  dirty: boolean;
}

function makeDefaultSketch(): SketchState {
  const preset = PRESETS[0];
  return {
    id: preset.id,
    name: preset.name,
    bpm: preset.bpm,
    voices: preset.voices.map((v) => ({ ...v })),
    grid: preset.grid,
    version: 1,
  };
}

export function makeInitialState(): AppState {
  const sketch = makeDefaultSketch();
  return {
    sketch,
    transport: makeTransport(sketch.bpm),
    activePresetId: PRESETS[0].id,
    dirty: false,
  };
}

/** Validate a raw parsed object as a SketchState. */
export function validateSketch(raw: unknown): raw is SketchState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== 'string' || s.id.length === 0) return false;
  if (typeof s.name !== 'string') return false;
  if (typeof s.bpm !== 'number' || s.bpm < 40 || s.bpm > 240) return false;
  if (!Array.isArray(s.voices) || s.voices.length === 0) return false;
  if (!s.grid || typeof s.grid !== 'object') return false;
  if (s.version !== 1) return false;
  return true;
}

/** Serialize sketch to JSON string. */
export function exportSketch(sketch: SketchState): string {
  return JSON.stringify(sketch, null, 2);
}

/** Parse and validate JSON string into a SketchState. */
export function importSketch(json: string): SketchState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: could not parse sketch data');
  }
  if (!validateSketch(raw)) {
    throw new Error('Invalid sketch: missing or malformed required fields');
  }
  return raw;
}

/** Persist a sketch to localStorage (no-op if unavailable). */
export function saveToStorage(sketch: SketchState): void {
  try {
    localStorage.setItem(STORAGE_KEY, exportSketch(sketch));
  } catch {
    // Storage unavailable (private browsing, quota exceeded) — silently skip
  }
}

/** Load a sketch from localStorage, returning null if missing or invalid. */
export function loadFromStorage(): SketchState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return importSketch(raw);
  } catch {
    return null;
  }
}

/** Clear persisted sketch from localStorage. */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Build a PatternGrid from a SketchState (for engine/renderer use). */
export function sketchToGrid(sketch: SketchState) {
  const baseGrid = makePatternGrid(sketch.voices);
  const deserialized = deserializeGrid(sketch.grid);
  for (const [id, steps] of deserialized.entries()) {
    if (baseGrid.has(id)) baseGrid.set(id, steps);
  }
  return baseGrid;
}

/** Convert current grid Map back into the sketch record format. */
export function gridToSketch(sketch: SketchState, grid: ReturnType<typeof makePatternGrid>): SketchState {
  return { ...sketch, grid: serializeGrid(grid) };
}
