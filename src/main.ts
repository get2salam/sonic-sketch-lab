import './style.css';
import { PRESETS, getPresetById } from './presets.js';
import { makeInitialState, loadFromStorage, saveToStorage, exportSketch, importSketch, sketchToGrid, gridToSketch } from './state.js';
import { makeTransport, advanceStep, getStepDuration, toggleStep, DEFAULT_STEPS } from './sequencer.js';
import { AudioEngine } from './audioEngine.js';
import { detectCapabilities, describeGaps } from './capabilities.js';
import { registry, registerCommands } from './commands.js';
import { generateWaveform, stepBarHeights } from './visualizer.js';
import { drawWaveform, drawStepBars } from './render.js';
import { initPwa } from './pwa.js';
import type { AppState } from './state.js';
import type { PatternGrid } from './sequencer.js';

// ── Bootstrap ────────────────────────────────────────────────────────
const caps = detectCapabilities();
const gaps = describeGaps(caps);
if (gaps.length) console.warn('[SonicSketch]', gaps.join(' | '));

const engine = new AudioEngine();
let appState: AppState = (() => {
  const stored = caps.localStorage ? loadFromStorage() : null;
  if (stored) {
    const s = makeInitialState();
    s.sketch = stored;
    s.transport = makeTransport(stored.bpm);
    return s;
  }
  return makeInitialState();
})();

let grid: PatternGrid = sketchToGrid(appState.sketch);
let tickTimer: ReturnType<typeof setTimeout> | null = null;

// ── DOM refs ─────────────────────────────────────────────────────────
const $presetList   = document.getElementById('preset-list')!;
const $playBtn      = document.getElementById('btn-play') as HTMLButtonElement;
const $stopBtn      = document.getElementById('btn-stop') as HTMLButtonElement;
const $bpmInput     = document.getElementById('bpm-input') as HTMLInputElement;
const $stepDisplay  = document.getElementById('step-display')!;
const $seqGrid      = document.getElementById('sequencer-grid')!;
const $synthCtrl    = document.getElementById('synth-controls')!;
const $vizCanvas    = document.getElementById('viz-canvas') as HTMLCanvasElement;
const $palette      = document.getElementById('command-palette')!;
const $paletteInput = document.getElementById('palette-input') as HTMLInputElement;
const $paletteList  = document.getElementById('palette-results')!;
const $ioDialog     = document.getElementById('io-dialog')!;
const $ioTextarea   = document.getElementById('io-textarea') as HTMLTextAreaElement;
const $announcer    = document.getElementById('aria-announcer')!;
const $btnExport    = document.getElementById('btn-export')!;
const $btnImport    = document.getElementById('btn-import')!;
const $btnCopy      = document.getElementById('btn-copy-json')!;
const $btnLoad      = document.getElementById('btn-load-json')!;
const $btnCloseIO   = document.getElementById('btn-close-dialog')!;
const $btnPalette   = document.getElementById('btn-palette')!;

const vizCtx = $vizCanvas.getContext('2d')!;

// ── Announce helper ──────────────────────────────────────────────────
function announce(msg: string) {
  $announcer.textContent = '';
  requestAnimationFrame(() => { $announcer.textContent = msg; });
}

// ── Preset browser ───────────────────────────────────────────────────
function renderPresets() {
  $presetList.innerHTML = '';
  for (const preset of PRESETS) {
    const li = document.createElement('li');
    li.className = 'preset-item';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', preset.id === appState.activePresetId ? 'true' : 'false');
    li.setAttribute('tabindex', '0');
    li.innerHTML = `<div class="preset-item-name">${preset.name}</div><div class="preset-item-desc">${preset.description}</div>`;
    li.addEventListener('click', () => loadPreset(preset.id));
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') loadPreset(preset.id); });
    $presetList.appendChild(li);
  }
}

function loadPreset(id: string) {
  const preset = getPresetById(id);
  if (!preset) return;
  stopTransport();
  appState = {
    ...appState,
    sketch: { id: preset.id, name: preset.name, bpm: preset.bpm, voices: preset.voices.map(v => ({...v})), grid: preset.grid, version: 1 },
    transport: makeTransport(preset.bpm),
    activePresetId: id,
    dirty: false,
  };
  grid = sketchToGrid(appState.sketch);
  $bpmInput.value = String(preset.bpm);
  renderGrid();
  renderSynth();
  renderViz();
  renderPresets();
  announce(`Loaded preset: ${preset.name}`);
}

// ── Sequencer grid ───────────────────────────────────────────────────
function renderGrid() {
  $seqGrid.innerHTML = '';
  for (const voice of appState.sketch.voices) {
    const row = document.createElement('div');
    row.className = 'grid-row';
    row.setAttribute('role', 'row');

    const label = document.createElement('span');
    label.className = 'grid-row-label';
    label.textContent = voice.name;
    row.appendChild(label);

    const steps = grid.get(voice.id) ?? [];
    steps.forEach((step, i) => {
      const btn = document.createElement('button');
      btn.className = 'step-btn';
      btn.setAttribute('aria-label', `${voice.name} step ${i + 1} ${step ? 'on' : 'off'}`);
      btn.setAttribute('aria-pressed', step ? 'true' : 'false');
      btn.setAttribute('data-active', step ? 'true' : 'false');
      btn.setAttribute('data-step', String(i));
      btn.setAttribute('data-voice', voice.id);
      if (i === appState.transport.currentStep && appState.transport.playing) {
        btn.setAttribute('data-current', 'true');
      }
      btn.addEventListener('click', () => {
        grid = toggleStep(grid, voice.id, i);
        appState = { ...appState, sketch: gridToSketch(appState.sketch, grid), dirty: true };
        if (caps.localStorage) saveToStorage(appState.sketch);
        updateStepBtn(btn, grid.get(voice.id)?.[i] ?? null);
      });
      row.appendChild(btn);
    });
    $seqGrid.appendChild(row);
  }
}

function updateStepBtn(btn: HTMLButtonElement, step: ReturnType<typeof grid.get> extends Array<infer T> | undefined ? (ReturnType<typeof grid.get> extends Array<infer T> ? T : never) : never) {
  const active = step !== null && step !== undefined;
  btn.setAttribute('data-active', active ? 'true' : 'false');
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  const label = btn.getAttribute('aria-label') ?? '';
  btn.setAttribute('aria-label', label.replace(/on$|off$/, active ? 'on' : 'off'));
}

function updateGridCurrentStep() {
  const step = appState.transport.currentStep;
  document.querySelectorAll<HTMLButtonElement>('.step-btn').forEach((btn) => {
    const btnStep = Number(btn.getAttribute('data-step'));
    btn.setAttribute('data-current', btnStep === step ? 'true' : 'false');
  });
  $stepDisplay.textContent = `Step ${step + 1}/${DEFAULT_STEPS}`;
}

// ── Synth controls ───────────────────────────────────────────────────
function renderSynth() {
  $synthCtrl.innerHTML = '';
  for (const voice of appState.sketch.voices) {
    const section = document.createElement('fieldset');
    section.style.cssText = 'border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:var(--space-3);grid-column:1/-1';
    section.innerHTML = `<legend style="font-size:var(--text-xs);font-family:var(--font-mono);color:var(--color-accent);padding:0 var(--space-2)">${voice.name}</legend>`;

    const makeParam = (label: string, id: string, type: 'range' | 'select', opts: Record<string, unknown>) => {
      const wrap = document.createElement('div');
      wrap.className = 'synth-param';
      if (type === 'range') {
        const min = String(opts.min ?? 0), max = String(opts.max ?? 1), step = String(opts.step ?? 0.01), val = String(opts.value ?? 0);
        wrap.innerHTML = `<label for="${id}">${label}: <span id="${id}-val">${Number(opts.value ?? 0).toFixed(2)}</span></label>
          <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" aria-valuetext="${val}">`;
      } else {
        const choices = (opts.choices as string[]).map(c => `<option${c === opts.value ? ' selected' : ''}>${c}</option>`).join('');
        wrap.innerHTML = `<label for="${id}">${label}</label><select id="${id}">${choices}</select>`;
      }
      return wrap;
    };

    const gainId = `gain-${voice.id}`;
    section.appendChild(makeParam('Gain', gainId, 'range', { min: 0, max: 1, step: 0.01, value: voice.gain }));
    const gainSlider = section.querySelector<HTMLInputElement>(`#${gainId}`)!;
    gainSlider.addEventListener('input', () => {
      voice.gain = parseFloat(gainSlider.value);
      section.querySelector<HTMLElement>(`#${gainId}-val`)!.textContent = voice.gain.toFixed(2);
      appState.dirty = true;
    });

    const oscId = `osc-${voice.id}`;
    section.appendChild(makeParam('Waveform', oscId, 'select', { choices: ['sine','square','sawtooth','triangle'], value: voice.oscillator.type }));
    section.querySelector<HTMLSelectElement>(`#${oscId}`)!.addEventListener('change', (e) => {
      voice.oscillator.type = (e.target as HTMLSelectElement).value as typeof voice.oscillator.type;
      appState.dirty = true;
    });

    $synthCtrl.appendChild(section);
  }
}

// ── Transport ─────────────────────────────────────────────────────────
function tick() {
  if (!appState.transport.playing) return;
  engine.triggerStep(grid, appState.sketch.voices, appState.transport.currentStep);
  appState = { ...appState, transport: advanceStep(appState.transport) };
  updateGridCurrentStep();
  renderViz();
  const interval = getStepDuration(appState.transport.bpm) * 1000;
  tickTimer = setTimeout(tick, interval);
}

async function startTransport() {
  await engine.resume();
  appState = { ...appState, transport: { ...appState.transport, playing: true, currentStep: 0 } };
  $playBtn.setAttribute('aria-pressed', 'true');
  tick();
  announce('Playing');
}

function stopTransport() {
  appState = { ...appState, transport: { ...appState.transport, playing: false, currentStep: 0 } };
  if (tickTimer !== null) { clearTimeout(tickTimer); tickTimer = null; }
  engine.stopAll();
  $playBtn.setAttribute('aria-pressed', 'false');
  updateGridCurrentStep();
  $stepDisplay.textContent = '';
  announce('Stopped');
}

$playBtn.addEventListener('click', () => {
  if (appState.transport.playing) stopTransport();
  else void startTransport();
});
$stopBtn.addEventListener('click', stopTransport);
$bpmInput.addEventListener('change', () => {
  const bpm = Math.max(40, Math.min(240, parseInt($bpmInput.value, 10)));
  $bpmInput.value = String(bpm);
  appState = { ...appState, transport: { ...appState.transport, bpm }, sketch: { ...appState.sketch, bpm } };
});

// ── Visualizer ───────────────────────────────────────────────────────
function renderViz() {
  const voice = appState.sketch.voices[0];
  if (!voice) return;
  const row = grid.get(voice.id) ?? [];
  const firstActive = row.find(s => s !== null);
  if (firstActive) {
    const waveform = generateWaveform(voice, firstActive.midi);
    drawWaveform(vizCtx, waveform);
  }
  const bars = stepBarHeights(appState.sketch.voices, grid, DEFAULT_STEPS);
  const barCanvas = document.createElement('canvas');
  barCanvas.width = $vizCanvas.width;
  barCanvas.height = 60;
  const bCtx = barCanvas.getContext('2d')!;
  drawStepBars(bCtx, bars, appState.transport.currentStep);
  vizCtx.drawImage(barCanvas, 0, Math.floor($vizCanvas.height * 0.6));
}

// ── Export / Import ──────────────────────────────────────────────────
$btnExport.addEventListener('click', () => {
  $ioTextarea.value = exportSketch(appState.sketch);
  $ioDialog.hidden = false;
  $ioTextarea.focus();
});
$btnImport.addEventListener('click', () => {
  $ioTextarea.value = '';
  $ioDialog.hidden = false;
  $ioTextarea.focus();
});
$btnCopy.addEventListener('click', async () => {
  await navigator.clipboard.writeText($ioTextarea.value).catch(() => {});
  announce('Copied to clipboard');
});
$btnLoad.addEventListener('click', () => {
  try {
    const sketch = importSketch($ioTextarea.value);
    stopTransport();
    appState = { ...appState, sketch, transport: makeTransport(sketch.bpm), activePresetId: null, dirty: false };
    grid = sketchToGrid(sketch);
    $bpmInput.value = String(sketch.bpm);
    renderGrid(); renderSynth(); renderViz(); renderPresets();
    $ioDialog.hidden = true;
    announce(`Loaded sketch: ${sketch.name}`);
  } catch (e) {
    announce(`Error: ${(e as Error).message}`);
  }
});
$btnCloseIO.addEventListener('click', () => { $ioDialog.hidden = true; });

// ── Command palette ──────────────────────────────────────────────────
function openPalette() {
  $palette.hidden = false;
  $paletteInput.value = '';
  renderPaletteResults('');
  $paletteInput.focus();
}
function closePalette() { $palette.hidden = true; }

function renderPaletteResults(q: string) {
  const cmds = registry.search(q);
  $paletteList.innerHTML = '';
  cmds.forEach((cmd, i) => {
    const li = document.createElement('li');
    li.className = 'palette-item';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    li.innerHTML = `<span class="palette-item-label">${cmd.label}${cmd.shortcut ? `<span class="palette-item-shortcut">${cmd.shortcut}</span>` : ''}</span><span class="palette-item-desc">${cmd.description}</span>`;
    li.addEventListener('click', () => { closePalette(); void registry.execute(cmd.id); });
    $paletteList.appendChild(li);
  });
}

$btnPalette.addEventListener('click', openPalette);
$paletteInput.addEventListener('input', () => renderPaletteResults($paletteInput.value));
$paletteInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePalette();
  if (e.key === 'Enter') {
    const first = $paletteList.querySelector<HTMLElement>('[aria-selected="true"]');
    first?.click();
  }
});
$palette.querySelector('.palette-backdrop')?.addEventListener('click', closePalette);
$ioDialog.querySelector('.dialog-backdrop')?.addEventListener('click', () => { $ioDialog.hidden = true; });

// ── Keyboard shortcuts ────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openPalette(); }
  if (e.key === 'Escape') { closePalette(); $ioDialog.hidden = true; }
  if (e.key === ' ' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLButtonElement)) {
    e.preventDefault();
    if (appState.transport.playing) stopTransport();
    else void startTransport();
  }
});

// ── Register commands ─────────────────────────────────────────────────
registerCommands([
  { id: 'transport.play', label: 'Play / Pause', description: 'Toggle sequencer playback', shortcut: 'Space', category: 'Transport', action: () => { if (appState.transport.playing) stopTransport(); else void startTransport(); } },
  { id: 'transport.stop', label: 'Stop', description: 'Stop sequencer and reset to step 1', shortcut: 'S', category: 'Transport', action: stopTransport },
  { id: 'preset.aurora', label: 'Load Aurora Pluck', description: 'Load the Aurora Pluck preset', category: 'Presets', action: () => loadPreset('aurora-pluck') },
  { id: 'preset.metro', label: 'Load Metro Bloom', description: 'Load the Metro Bloom preset', category: 'Presets', action: () => loadPreset('metro-bloom') },
  { id: 'preset.glass', label: 'Load Glass Tide', description: 'Load the Glass Tide preset', category: 'Presets', action: () => loadPreset('glass-tide') },
  { id: 'sketch.export', label: 'Export Sketch', description: 'Export current sketch as JSON', category: 'Sketch', action: () => { $ioTextarea.value = exportSketch(appState.sketch); $ioDialog.hidden = false; } },
  { id: 'sketch.import', label: 'Import Sketch', description: 'Import a sketch from JSON', category: 'Sketch', action: () => { $ioTextarea.value = ''; $ioDialog.hidden = false; } },
]);

// ── Init ──────────────────────────────────────────────────────────────
renderPresets();
renderGrid();
renderSynth();
renderViz();
void initPwa();
