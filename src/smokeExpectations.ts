/** Strings that must appear in the built dist/ output for smoke validation. */
export const REQUIRED_STRINGS: readonly string[] = [
  'SonicSketch Lab',
  'Aurora Pluck',
  'Metro Bloom',
  'Glass Tide',
  'manifest.webmanifest',
  'sonic-sketch-lab',
];

/** Strings that must NOT appear anywhere in dist/ (privacy/safety guard). */
export const FORBIDDEN_STRINGS: readonly string[] = [
  'localhost:',
  'PRIVATE',
  'SECRET',
  'API_KEY',
  'password',
  'Bearer ',
];

export const EXPECTED_DIST_FILES = [
  'index.html',
  'manifest.webmanifest',
] as const;
