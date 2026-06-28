#!/usr/bin/env node
/**
 * Smoke-test the production build under dist/.
 * Verifies required strings exist and forbidden strings are absent.
 * Exit code 0 = pass, 1 = fail.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DIST = resolve(new URL('.', import.meta.url).pathname, '..', 'dist');

// Inline expectations so the script is self-contained
const REQUIRED_STRINGS = [
  'SonicSketch Lab',
  'Aurora Pluck',
  'Metro Bloom',
  'Glass Tide',
  'manifest.webmanifest',
  'sonic-sketch-lab',
];

const FORBIDDEN_STRINGS = [
  'localhost:',
  'PRIVATE',
  'SECRET',
  'API_KEY',
  'password',
  'token',
];

const REQUIRED_FILES = ['index.html', 'manifest.webmanifest'];

let failed = false;

function fail(msg) {
  console.error(`[smoke] FAIL: ${msg}`);
  failed = true;
}

function pass(msg) {
  console.log(`[smoke] ok  : ${msg}`);
}

// 1. Check dist directory exists
if (!existsSync(DIST)) {
  fail(`dist/ directory not found at ${DIST} — run "npm run build" first`);
  process.exit(1);
}

// 2. Check required files exist
for (const file of REQUIRED_FILES) {
  const p = join(DIST, file);
  if (existsSync(p)) {
    pass(`required file present: ${file}`);
  } else {
    fail(`required file missing: ${file}`);
  }
}

// 3. Collect all text files in dist
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const allFiles = collectFiles(DIST);
const textFiles = allFiles.filter((f) => /\.(html|js|css|json|webmanifest|txt)$/.test(f));

// Aggregate all text content
let allContent = '';
for (const f of textFiles) {
  try {
    allContent += readFileSync(f, 'utf8');
  } catch {
    // binary or unreadable — skip
  }
}

// 4. Required strings
for (const s of REQUIRED_STRINGS) {
  if (allContent.includes(s)) {
    pass(`required string present: "${s}"`);
  } else {
    fail(`required string missing: "${s}"`);
  }
}

// 5. Forbidden strings
for (const s of FORBIDDEN_STRINGS) {
  if (!allContent.includes(s)) {
    pass(`forbidden string absent: "${s}"`);
  } else {
    fail(`forbidden string found in build output: "${s}"`);
  }
}

if (failed) {
  console.error('\n[smoke] SMOKE TEST FAILED');
  process.exit(1);
} else {
  console.log('\n[smoke] All checks passed.');
}
