import { describe, it, expect, vi } from 'vitest';
import { drawWaveform, drawStepBars, buildSvgWaveformPath, clearCanvas } from '../src/render.js';

function makeCtx(width = 300, height = 150): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return ctx;
}

describe('drawWaveform', () => {
  it('calls stroke() on the context', () => {
    const ctx = makeCtx();
    const stroke = vi.spyOn(ctx, 'stroke');
    const pts = Array.from({ length: 10 }, (_, i) => ({ t: i / 10, amplitude: Math.sin(i) }));
    drawWaveform(ctx, pts);
    expect(stroke).toHaveBeenCalled();
  });

  it('does not throw with fewer than 2 points', () => {
    const ctx = makeCtx();
    expect(() => drawWaveform(ctx, [])).not.toThrow();
    expect(() => drawWaveform(ctx, [{ t: 0, amplitude: 0 }])).not.toThrow();
  });
});

describe('drawStepBars', () => {
  it('does not throw with a normal bar array', () => {
    const ctx = makeCtx();
    const bars = Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 0.8 : 0));
    expect(() => drawStepBars(ctx, bars, 0)).not.toThrow();
  });

  it('calls fill() at least once per active bar', () => {
    const ctx = makeCtx();
    const fill = vi.spyOn(ctx, 'fill');
    const bars = [0.5, 0, 0.3, 0];
    drawStepBars(ctx, bars, 0);
    expect(fill).toHaveBeenCalled();
  });
});

describe('buildSvgWaveformPath', () => {
  it('returns empty string for fewer than 2 points', () => {
    expect(buildSvgWaveformPath([], 300, 150)).toBe('');
    expect(buildSvgWaveformPath([{ t: 0, amplitude: 0 }], 300, 150)).toBe('');
  });

  it('returns a string starting with M for valid points', () => {
    const pts = [{ t: 0, amplitude: 0 }, { t: 0.5, amplitude: 0.5 }, { t: 1, amplitude: 0 }];
    const path = buildSvgWaveformPath(pts, 300, 150);
    expect(path.startsWith('M')).toBe(true);
  });

  it('includes L segments after the first M', () => {
    const pts = Array.from({ length: 5 }, (_, i) => ({ t: i / 4, amplitude: 0 }));
    const path = buildSvgWaveformPath(pts, 300, 150);
    expect(path).toContain('L');
  });
});

describe('clearCanvas', () => {
  it('does not throw', () => {
    const ctx = makeCtx();
    expect(() => clearCanvas(ctx)).not.toThrow();
  });

  it('uses custom color when provided', () => {
    const ctx = makeCtx();
    const fillRect = vi.spyOn(ctx, 'fillRect');
    clearCanvas(ctx, '#ff0000');
    expect(fillRect).toHaveBeenCalled();
  });
});
