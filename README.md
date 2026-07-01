# SonicSketch Lab

Browser-based Web Audio sketchpad for composing tiny synth loops — built with TypeScript, Vite 8, and the Web Audio API.

## Features

- **Step sequencer** — 16-step grid per voice, toggle steps on/off, live playback
- **Multi-voice synths** — per-voice oscillator type, ADSR envelope, filter, and gain controls
- **Visualizer** — real-time waveform and step-activity bar display
- **Preset library** — Aurora Pluck, Metro Bloom, and Glass Tide sketches to get started
- **Export / Import** — save and restore sketches as JSON
- **Command palette** — keyboard-searchable command launcher (Ctrl+K / ⌘K)
- **PWA shell** — offline-capable via service worker
- **Accessibility** — ARIA live regions, keyboard navigation, focus management

## Getting started

```bash
npm install
npm run dev       # start dev server at http://localhost:5173
npm run build     # production build → dist/
npm test          # run unit tests (148 tests)
npm run coverage  # run tests + enforce coverage thresholds (≥50% stmts, ≥85% branches/functions)
npm run smoke     # smoke-test the dist/ output
```

## Project layout

```
src/
  audioEngine.ts      guarded Web Audio engine wrapper
  audioMath.ts        note/frequency/ADSR math helpers
  capabilities.ts     browser feature detection
  commands.ts         command registry
  presets.ts          built-in sketch presets
  render.ts           canvas and SVG renderer helpers
  sequencer.ts        step sequencer pattern logic
  smokeExpectations.ts  required / forbidden output strings
  state.ts            app state management and serialization
  synthModel.ts       synth voice types and defaults
  visualizer.ts       deterministic waveform data helpers
  pwa.ts              service worker registration
  main.ts             app entry point
  ui/
    accessibility.ts    ARIA announce helpers
    commandPalette.ts   command palette dialog
    ioDialog.ts         export/import JSON dialog
    synthControls.ts    per-voice synth parameter UI
    transport.ts        play/stop/BPM controls
    visualizerPanel.ts  waveform + step-bar canvas rendering
tests/
  audioMath.test.ts
  capabilities.test.ts
  commands.test.ts
  presets.test.ts
  render.test.ts
  sequencer.test.ts
  state.test.ts
  synthModel.test.ts
  visualizer.test.ts
scripts/
  smoke.mjs          production build smoke tests
public/
  manifest.webmanifest
  sw.js              service worker
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Ctrl+K` / `⌘K` | Open command palette |
| `Escape` | Close dialog / palette |

## Tech stack

- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 8](https://vitejs.dev/)
- [Vitest 3](https://vitest.dev/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## License

MIT
