#!/usr/bin/env bash
# Generate a QA sync report for a demo project.
# Outputs a markdown report with frame paths + narration text per beat.
# The report is meant to be fed to a vision model along with the frames.
#
# Usage: qa-sync-check.sh <project-dir>
# Example: qa-sync-check.sh demofly/note-workflow
#
# Requires: node

set -euo pipefail

PROJECT_DIR="${1:?Usage: qa-sync-check.sh <project-dir>}"
TIMING="$PROJECT_DIR/recordings/timing.json"
TRANSCRIPT="$PROJECT_DIR/transcript.md"
FRAMES_DIR="$PROJECT_DIR/qa/frames"
REPORT="$PROJECT_DIR/qa/sync-report.md"

if [[ ! -f "$TIMING" ]]; then
  echo "Error: timing.json not found at $TIMING" >&2
  exit 1
fi

if [[ ! -f "$TRANSCRIPT" ]]; then
  echo "Error: transcript.md not found at $TRANSCRIPT" >&2
  exit 1
fi

if [[ ! -d "$FRAMES_DIR" ]]; then
  echo "Error: frames directory not found at $FRAMES_DIR. Run extract-frames.sh first." >&2
  exit 1
fi

mkdir -p "$(dirname "$REPORT")"

node -e "
const fs = require('fs');
const path = require('path');

const timing = JSON.parse(fs.readFileSync('$TIMING', 'utf8'));
const transcript = fs.readFileSync('$TRANSCRIPT', 'utf8');
const framesDir = '$FRAMES_DIR';

// Parse transcript into beats
const beats = [];
let currentScene = null;
for (const line of transcript.split('\n')) {
  const sceneMatch = line.match(/^## Scene (\d+):\s*(.+)/);
  if (sceneMatch) {
    currentScene = { num: parseInt(sceneMatch[1]), title: sceneMatch[2].trim() };
    continue;
  }
  const beatMatch = line.match(/^### Beat ([\d.]+)\s*—\s*(.+?)\s*\[at (\d+)ms,\s*window:\s*([\d.]+)s\]/);
  if (beatMatch && currentScene) {
    beats.push({
      id: beatMatch[1],
      label: beatMatch[2],
      ms: parseInt(beatMatch[3]),
      window: parseFloat(beatMatch[4]),
      scene: currentScene,
      narration: []
    });
    continue;
  }
  // Collect narration lines for current beat
  if (beats.length > 0 && line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
    const cleaned = line.trim();
    if (!cleaned.startsWith('_') || !cleaned.endsWith('_')) {
      // Not a silent portion note
      beats[beats.length - 1].narration.push(cleaned);
    }
  }
}

// Find nearest frame for each beat timestamp
const frames = fs.readdirSync(framesDir).filter(f => f.endsWith('.png')).sort();

function findNearestFrame(ms) {
  // Frame filenames contain the label but not directly the ms
  // We'll match based on scene + action proximity
  return frames; // Return all frames — the vision model will be given the relevant ones
}

// Generate report
let report = '# QA Sync Report\\n\\n';
report += 'Generated from: timing.json + transcript.md + extracted frames\\n\\n';
report += '## Instructions for Vision Model\\n\\n';
report += 'For each beat below, examine the frame image at the given timestamp.\\n';
report += 'Compare what is VISIBLE on screen against the NARRATION text.\\n';
report += 'Flag any of these issues:\\n';
report += '- **BLANK_SCREEN**: Frame shows blank/white/loading screen but narration describes UI\\n';
report += '- **PREMATURE**: Narration describes action/result that hasn\\'t happened yet on screen\\n';
report += '- **LATE**: Narration describes action that already happened 2+ seconds ago\\n';
report += '- **GENERIC**: Narration could describe any app — not specific to what\\'s visible\\n';
report += '- **MISMATCH**: Narration describes something different from what\\'s on screen\\n';
report += '- **OK**: Narration matches what\\'s visible\\n\\n';

for (const beat of beats) {
  const sec = (beat.ms / 1000).toFixed(1);
  const narrationText = beat.narration.join(' ').replace(/\[.*?\]\s*/g, '').trim();
  
  report += '---\\n\\n';
  report += '### Beat ' + beat.id + ' — ' + beat.label + '\\n\\n';
  report += '- **Timestamp**: ' + sec + 's (Scene ' + beat.scene.num + ': ' + beat.scene.title + ')\\n';
  report += '- **Window**: ' + beat.window + 's\\n';
  report += '- **Narration**: \"' + narrationText + '\"\\n';
  report += '- **Frame**: (see ' + beat.id.replace('.', '_') + ' frame at ' + sec + 's)\\n\\n';
}

// Summary section
report += '---\\n\\n';
report += '## Summary\\n\\n';
report += '| Beat | Timestamp | Narration (first 40 chars) | Status |\\n';
report += '|------|-----------|---------------------------|--------|\\n';
for (const beat of beats) {
  const sec = (beat.ms / 1000).toFixed(1);
  const narr = beat.narration.join(' ').replace(/\[.*?\]\s*/g, '').trim().substring(0, 40);
  report += '| ' + beat.id + ' | ' + sec + 's | ' + narr + ' | _(check frame)_ |\\n';
}

fs.writeFileSync('$REPORT', report, 'utf8');
console.log('QA report written to $REPORT');
console.log('Beats analyzed: ' + beats.length);
console.log('Frames available: ' + frames.length);
" 

echo ""
cat "$REPORT"
