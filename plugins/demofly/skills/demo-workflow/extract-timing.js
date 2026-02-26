#!/usr/bin/env node

/**
 * Deterministic extraction of DEMOFLY timing markers from Playwright console output.
 *
 * Exported function:
 *   parseDemoflyMarkers(logText) → TimingData object
 *
 * CLI usage:
 *   node extract-timing.js <input.log> <output.json>
 */

const MARKER_RE = /DEMOFLY\|([^|]+)\|([^|]+)\|([^|]*)\|(\d+)/;

/**
 * Parse DEMOFLY markers from raw log text and return a TimingData object.
 *
 * @param {string} logText — raw console/log output containing DEMOFLY| lines
 * @returns {{ totalDuration: number, scenes: Array<{ sceneId: string, startMs: number, endMs: number, markers: Array<{ action: string, target: string, ms: number }> }> }}
 */
export function parseDemoflyMarkers(logText) {
  const lines = logText
    .split('\n')
    .map((l) => l.match(MARKER_RE))
    .filter(Boolean)
    .map((m) => ({ scene: m[1], action: m[2], target: m[3], ms: parseInt(m[4], 10) }));

  const scenes = [];
  let current = null;

  for (const l of lines) {
    if (l.action === 'start') {
      current = { sceneId: l.scene, startMs: l.ms, endMs: 0, markers: [] };
      scenes.push(current);
    } else if (l.action === 'end' && current) {
      current.endMs = l.ms;
      current = null;
    } else if (current) {
      current.markers.push({ action: l.action, target: l.target, ms: l.ms });
    }
  }

  return {
    totalDuration: scenes.length
      ? scenes[scenes.length - 1].endMs - scenes[0].startMs
      : 0,
    scenes,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
const isCLI = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isCLI) {
  const [inputPath, outputPath] = process.argv.slice(2);

  if (!inputPath || !outputPath) {
    console.error('Usage: node extract-timing.js <input.log> <output.json>');
    process.exit(1);
  }

  const { readFileSync, writeFileSync, mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');

  const logText = readFileSync(inputPath, 'utf8');
  const result = parseDemoflyMarkers(logText);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');

  console.error(
    `Wrote timing.json: ${result.scenes.length} scene(s), ${result.totalDuration}ms total`,
  );
}
