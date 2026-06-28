import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawWaveform, drawStepBars, buildSvgWaveformPath, clearCanvas } from '../src/render.js';
import type { WaveformPoint } from '../src/visualizer.js';

function makeCtxMock(): CanvasRenderingContext2D {
  const fns: Record<string, ReturnType<typeof vi.fn>> = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    roundRect: vi.fn(),
  };
  const canvas = { width: 300, height: 150 } as HTMLCanvasElement;
  const ctx = {
    canvas,
    clearRect: fns.clearRect,
    fillRect: fns.fillRect,
    beginPath: fns.beginPath,
    moveTo: fns.moveTo,
    lineTo: fns.lineTo,
    stroke: fns.stroke,
    fill: fns.fill,
    roundRect: fns.roundRect,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'round',
    lineCap: 'round',
  } as unknown as CanvasRenderingContext2D;
  return ctx;
}

const flatPts: WaveformPoint[] = Array.from({ length: 20 }, (_, i) => ({ t: i / 20, amplitude: 0.5 }));

describe('drawWaveform', () => {
  let ctx: CanvasRenderingContext2D;
  beforeEach(() => { ctx = makeCtxMock(); });

  it('calls stroke() on the context', () => {
    drawWaveform(ctx, flatPts);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('does not throw with empty points', () => {
    expect(() => drawWaveform(ctx, [])).not.toThrow();
  });

  it('does not throw with a single point', () => {
    expect(() => drawWaveform(ctx, [{ t: 0, amplitude: 0 }])).not.toThrow();
  });

  it('calls beginPath', () => {
    drawWaveform(ctx, flatPts);
    expect(ctx.beginPath).toHaveBeenCalled();
  });
});

describe('drawStepBars', () => {
  let ctx: CanvasRenderingContext2D;
  beforeEach(() => { ctx = makeCtxMock(); });

  it('does not throw with a normal bar array', () => {
    const bars = Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 0.8 : 0));
    expect(() => drawStepBars(ctx, bars, 0)).not.toThrow();
  });

  it('calls fill() at least once per active bar', () => {
    const bars = [0.5, 0, 0.3, 0];
    drawStepBars(ctx, bars, 0);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('calls beginPath for each bar', () => {
    const bars = [0.4, 0.4];
    drawStepBars(ctx, bars, 1);
    expect(ctx.beginPath).toHaveBeenCalledTimes(2);
  });
});

describe('buildSvgWaveformPath', () => {
  it('returns empty string for fewer than 2 points', () => {
    expect(buildSvgWaveformPath([], 300, 150)).toBe('');
    expect(buildSvgWaveformPath([{ t: 0, amplitude: 0 }], 300, 150)).toBe('');
  });

  it('returns a string starting with M for valid points', () => {
    const path = buildSvgWaveformPath(flatPts, 300, 150);
    expect(path.startsWith('M')).toBe(true);
  });

  it('contains L segments after the first M', () => {
    const path = buildSvgWaveformPath(flatPts, 300, 150);
    expect(path).toContain('L');
  });
});

describe('clearCanvas', () => {
  let ctx: CanvasRenderingContext2D;
  beforeEach(() => { ctx = makeCtxMock(); });

  it('does not throw', () => {
    expect(() => clearCanvas(ctx)).not.toThrow();
  });

  it('calls fillRect to cover the canvas', () => {
    clearCanvas(ctx, '#ff0000');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 300, 150);
  });
});
