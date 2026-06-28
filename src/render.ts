import type { WaveformPoint } from './visualizer.js';

/** Draw a waveform onto a canvas 2D context. */
export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  points: WaveformPoint[],
  options: {
    strokeColor?: string;
    lineWidth?: number;
    bgColor?: string;
    padding?: number;
  } = {},
): void {
  const { strokeColor = '#6ee7b7', lineWidth = 2, bgColor = '#0f0f14', padding = 8 } = options;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  if (points.length < 2) return;

  const drawW = w - padding * 2;
  const drawH = h - padding * 2;
  const midY = padding + drawH / 2;

  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let i = 0; i < points.length; i++) {
    const x = padding + (i / (points.length - 1)) * drawW;
    const y = midY - points[i].amplitude * (drawH / 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Center line
  ctx.beginPath();
  ctx.strokeStyle = `${strokeColor}33`;
  ctx.lineWidth = 1;
  ctx.moveTo(padding, midY);
  ctx.lineTo(w - padding, midY);
  ctx.stroke();
}

/** Draw bar heights onto a canvas (for step activity visualization). */
export function drawStepBars(
  ctx: CanvasRenderingContext2D,
  barHeights: number[],
  currentStep: number,
  options: {
    activeColor?: string;
    inactiveColor?: string;
    currentColor?: string;
    bgColor?: string;
    gap?: number;
  } = {},
): void {
  const {
    activeColor = '#a78bfa',
    inactiveColor = '#2a2a3a',
    currentColor = '#fde68a',
    bgColor = '#0f0f14',
    gap = 2,
  } = options;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  const n = barHeights.length;
  const barW = (w - gap * (n + 1)) / n;
  const maxBarH = h - gap * 2;

  for (let i = 0; i < n; i++) {
    const x = gap + i * (barW + gap);
    const barH = Math.max(2, barHeights[i] * maxBarH);
    const y = h - gap - barH;
    ctx.fillStyle = i === currentStep ? currentColor : barHeights[i] > 0.01 ? activeColor : inactiveColor;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 2);
    ctx.fill();
  }
}

/** Build an SVG waveform path string (for static rendering or export). */
export function buildSvgWaveformPath(
  points: WaveformPoint[],
  width: number,
  height: number,
  padding: number = 8,
): string {
  if (points.length < 2) return '';
  const drawW = width - padding * 2;
  const drawH = height - padding * 2;
  const midY = padding + drawH / 2;
  const parts: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const x = (padding + (i / (points.length - 1)) * drawW).toFixed(2);
    const y = (midY - points[i].amplitude * (drawH / 2)).toFixed(2);
    parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return parts.join(' ');
}

/** Clear a canvas to a flat color. */
export function clearCanvas(ctx: CanvasRenderingContext2D, color: string = '#0f0f14'): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
