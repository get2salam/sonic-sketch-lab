import type { SynthVoice } from '../synthModel.js';
import type { PatternGrid } from '../sequencer.js';
import { generateWaveform, stepBarHeights } from '../visualizer.js';
import { drawWaveform, drawStepBars } from '../render.js';

/** Render waveform + step-bar overlay into a canvas context. */
export function renderVisualizerPanel(
  ctx: CanvasRenderingContext2D,
  voices: SynthVoice[],
  grid: PatternGrid,
  currentStep: number,
  stepCount: number,
): void {
  const voice = voices[0];
  if (!voice) return;

  const row = grid.get(voice.id) ?? [];
  const firstActive = row.find((s) => s !== null);
  if (firstActive) {
    const waveform = generateWaveform(voice, firstActive.midi);
    drawWaveform(ctx, waveform);
  }

  const bars = stepBarHeights(voices, grid, stepCount);
  const barCanvas = document.createElement('canvas');
  barCanvas.width = ctx.canvas.width;
  barCanvas.height = 60;
  const bCtx = barCanvas.getContext('2d')!;
  drawStepBars(bCtx, bars, currentStep);
  ctx.drawImage(barCanvas, 0, Math.floor(ctx.canvas.height * 0.6));
}

/** Clear the visualizer canvas to the default background. */
export function clearVisualizerPanel(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0f0f14';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
