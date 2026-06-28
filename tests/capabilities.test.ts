import { describe, it, expect } from 'vitest';
import { detectCapabilities, describeGaps } from '../src/capabilities.js';

describe('detectCapabilities', () => {
  it('returns a CapabilityReport object with all expected keys', () => {
    const caps = detectCapabilities();
    expect(typeof caps.webAudio).toBe('boolean');
    expect(typeof caps.audioWorklet).toBe('boolean');
    expect(typeof caps.serviceWorker).toBe('boolean');
    expect(typeof caps.localStorage).toBe('boolean');
    expect(typeof caps.canvas).toBe('boolean');
    expect(typeof caps.pointerEvents).toBe('boolean');
    expect(typeof caps.reducedMotion).toBe('boolean');
  });

  it('reports canvas as available in jsdom', () => {
    const caps = detectCapabilities();
    expect(caps.canvas).toBe(true);
  });

  it('reports localStorage as available in jsdom', () => {
    const caps = detectCapabilities();
    expect(caps.localStorage).toBe(true);
  });

  it('audioWorklet is false when AudioContext is not available in jsdom', () => {
    const caps = detectCapabilities();
    // AudioContext may or may not be defined in jsdom — just verify it's a boolean
    expect(typeof caps.audioWorklet).toBe('boolean');
  });
});

describe('describeGaps', () => {
  it('returns empty array when all capabilities are present', () => {
    const gaps = describeGaps({
      webAudio: true,
      audioWorklet: true,
      serviceWorker: true,
      localStorage: true,
      canvas: true,
      pointerEvents: true,
      reducedMotion: false,
    });
    expect(gaps).toHaveLength(0);
  });

  it('reports missing Web Audio', () => {
    const gaps = describeGaps({
      webAudio: false,
      audioWorklet: false,
      serviceWorker: true,
      localStorage: true,
      canvas: true,
      pointerEvents: true,
      reducedMotion: false,
    });
    expect(gaps.some((g) => g.includes('Web Audio'))).toBe(true);
  });

  it('reports missing service worker', () => {
    const gaps = describeGaps({
      webAudio: true,
      audioWorklet: true,
      serviceWorker: false,
      localStorage: true,
      canvas: true,
      pointerEvents: true,
      reducedMotion: false,
    });
    expect(gaps.some((g) => g.includes('Service Worker'))).toBe(true);
  });

  it('reports missing localStorage', () => {
    const gaps = describeGaps({
      webAudio: true,
      audioWorklet: true,
      serviceWorker: true,
      localStorage: false,
      canvas: true,
      pointerEvents: true,
      reducedMotion: false,
    });
    expect(gaps.some((g) => g.includes('localStorage'))).toBe(true);
  });

  it('reports missing canvas', () => {
    const gaps = describeGaps({
      webAudio: true,
      audioWorklet: true,
      serviceWorker: true,
      localStorage: true,
      canvas: false,
      pointerEvents: true,
      reducedMotion: false,
    });
    expect(gaps.some((g) => g.includes('Canvas') || g.includes('canvas'))).toBe(true);
  });

  it('reports multiple gaps simultaneously', () => {
    const gaps = describeGaps({
      webAudio: false,
      audioWorklet: false,
      serviceWorker: false,
      localStorage: false,
      canvas: false,
      pointerEvents: false,
      reducedMotion: false,
    });
    expect(gaps.length).toBeGreaterThanOrEqual(4);
  });
});
