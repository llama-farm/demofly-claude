# QuickNotes — Demofly Sample Demo

A complete working example showing the full Demofly artifact pipeline end-to-end.

## What's Here

```
examples/quicknotes/
├── src/                        # QuickNotes app (React + Vite + Tailwind)
└── demofly/
    ├── context.md              # Product context — describes the app for demo generation
    └── quickdemo/
        ├── proposal.md         # Demo proposal — narrative concept, scenes, timing targets
        ├── script.md           # Script — beat-by-beat narration + actions (master doc)
        ├── demo.spec.ts        # Playwright test — implements the script as browser automation
        ├── playwright.config.ts # Playwright config — viewport, video, base URL
        └── expected/
            ├── timing.json     # Sample timing output (what the pipeline produces)
            └── transcript.md   # Sample transcript output (generated from timing + script)
```

## The Artifact Pipeline

1. **context.md** — Agent explores your app and captures product understanding
2. **proposal.md** — Agent proposes a demo concept with scenes and timing
3. **script.md** — Agent writes a beat-centric script pairing narration with actions
4. **demo.spec.ts** — Agent generates a Playwright test that performs the scripted actions
5. **Run the test** → produces a video recording + `timing.json` with marker timestamps
6. **Post-process** → generates `transcript.md` aligned to the recording

The `expected/` directory contains sample outputs so you can see what steps 5-6 produce without running anything.

## Running It

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cd examples/quicknotes
npm install
npx playwright install chromium
```

### Run the App

```bash
npm run dev
```

App runs at http://127.0.0.1:4567

### Run the Demo Recording

In a separate terminal (while the app is running):

```bash
cd demofly/quickdemo
npx playwright test
```

This runs the Playwright test, which:
- Automates the QuickNotes app through all 4 scenes
- Records video to `test-results/`
- Logs DEMOFLY timing markers to stdout

### What You Get

After running, check `test-results/` for the video recording. The timing markers printed to stdout follow the format:

```
DEMOFLY|scene-1|start||0
DEMOFLY|scene-1|navigate|home|120
DEMOFLY|scene-1|click|note-title|1540
...
```

Compare with `expected/timing.json` and `expected/transcript.md` to see the full pipeline output.

## About the App

QuickNotes is a minimal single-page note-taking app built with:
- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- In-memory state (no database)

Features: create, view, edit, delete notes, and search/filter by title or body text.

## Version

This example targets the current development version of Demofly. If artifact formats change, this example may need updating.
