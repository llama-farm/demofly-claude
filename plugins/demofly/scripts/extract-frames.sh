#!/usr/bin/env bash
# Extract frames from a demo video at each beat timestamp from timing.json.
# Outputs PNG frames to <project-dir>/qa/frames/
#
# Usage: extract-frames.sh <project-dir>
# Example: extract-frames.sh demofly/note-workflow
#
# Requires: ffmpeg, node

set -euo pipefail

PROJECT_DIR="${1:?Usage: extract-frames.sh <project-dir>}"
VIDEO="$PROJECT_DIR/recordings/video.webm"
TIMING="$PROJECT_DIR/recordings/timing.json"
OUTDIR="$PROJECT_DIR/qa/frames"

if [[ ! -f "$VIDEO" ]]; then
  echo "Error: Video not found at $VIDEO" >&2
  exit 1
fi

if [[ ! -f "$TIMING" ]]; then
  echo "Error: timing.json not found at $TIMING" >&2
  exit 1
fi

rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

# Generate and run all ffmpeg commands via node
node -e "
const timing = require('./$TIMING');
const frames = [];

for (const scene of timing.scenes) {
  frames.push({ ms: scene.startMs, label: scene.sceneId + '_start' });
  for (const marker of scene.markers) {
    if (marker.action === 'start' || marker.action === 'end') continue;
    const label = scene.sceneId + '_' + marker.action + '_' + (marker.target || 'unknown');
    frames.push({ ms: marker.ms, label: label.replace(/[^a-zA-Z0-9_-]/g, '_') });
  }
  frames.push({ ms: scene.endMs, label: scene.sceneId + '_end' });
}

// Deduplicate by ms
const seen = new Set();
const unique = frames.filter(f => { if (seen.has(f.ms)) return false; seen.add(f.ms); return true; });
unique.sort((a, b) => a.ms - b.ms);

const { execSync } = require('child_process');
let count = 0;
for (const f of unique) {
  const ts = (f.ms / 1000).toFixed(3);
  const out = '$OUTDIR/' + f.label + '.png';
  try {
    execSync('ffmpeg -hide_banner -loglevel error -y -ss ' + ts + ' -i $VIDEO -frames:v 1 ' + out, { stdio: 'pipe' });
    console.log('✓ ' + f.label + ' @ ' + ts + 's');
    count++;
  } catch (e) {
    console.error('✗ ' + f.label + ' @ ' + ts + 's — ffmpeg failed');
  }
}
console.log('');
console.log('Extracted ' + count + ' frames to $OUTDIR/');
"
