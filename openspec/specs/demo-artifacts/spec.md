## Purpose

Defines the artifact pipeline format and directory structure for demo generation.

## Requirements

### Requirement: Artifacts are stored in demofly directory with subdirectories per demo

All demo artifacts SHALL be written to a `demofly/` directory in the user's project root, with each demo in its own subdirectory (`demofly/<demo-name>/`). Shared product context SHALL be at the demofly root (`demofly/context.md`).

#### Scenario: First demo creates directory structure

- **WHEN** the agent creates a demo named "product-tour"
- **THEN** the directory `demofly/product-tour/` is created and artifacts are written inside it

#### Scenario: Shared context at root level

- **WHEN** product exploration completes
- **THEN** `demofly/context.md` exists at the demofly root, not inside a demo subdirectory

### Requirement: context.md captures product understanding

The `demofly/context.md` file SHALL contain a lightweight summary of the product: app URL, tech stack, key pages/routes, notable features, and any UI framework specifics that affect Playwright selector strategy (e.g., Radix dropdowns, custom date pickers). It SHALL be concise (under 60 lines).

#### Scenario: Context created from parallel exploration

- **WHEN** both the codebase explorer and UI explorer sub-agents return results
- **THEN** the agent synthesizes their findings into a single context.md

#### Scenario: Context reused across demos

- **WHEN** the user creates a second demo and context.md already exists
- **THEN** the agent reads the existing context.md and checks it against the running app before proceeding

### Requirement: proposal.md defines the demo narrative

Each demo's `proposal.md` SHALL contain: the demo concept (what story is being told), a scene list with brief descriptions, demo data that will appear on screen (names, values, etc.), and a target total duration with rough per-scene time allocations.

The agent SHALL present the proposal to the user for review and approval before proceeding to script generation.

#### Scenario: User approves proposal

- **WHEN** the agent presents the proposal
- **THEN** it waits for user confirmation before generating the script

#### Scenario: User requests changes to proposal

- **WHEN** the user says "change scene 3 to show the reports feature instead"
- **THEN** the agent updates proposal.md and re-presents it

### Requirement: script.md is the master document with narration, interactions, and sync notes

Each demo's `script.md` SHALL be structured around **beats** — the atomic unit that pairs a narration fragment with its ordered actions and a timing marker.

A scene SHALL contain one or more beats. Each beat SHALL have:
1. A heading with beat number, descriptive label, and marker ID in the format: `### {scene}.{beat} — {label}  → \`{marker-id}\``
2. A markdown table with `Words` and `Action` columns

Beat table rules:
- Each row pairs a narration phrase with the action that happens during/alongside it
- Multi-action sequences for a single phrase SHALL use continuation rows (empty Words cell)
- Silent beats (no narration) SHALL use `*(silence — description)*` in the Words cell
- Static beats (narration over a still screen) SHALL have Words but no actions (empty Action cell or `*(screen static)*`)

The marker ID in each beat heading SHALL match a marker emitted by the Playwright script's `mark()` helper. Every beat MUST have a corresponding marker in demo.spec.ts.

#### Scenario: Script uses beat-centric format

- **WHEN** the agent generates script.md
- **THEN** each scene contains numbered beats, each with a Words/Action table and a marker ID in the heading

#### Scenario: Silent beat is explicit

- **WHEN** a scene includes a moment where the viewer watches an action without narration (e.g., waiting for an API response)
- **THEN** the script contains a beat with `*(silence — description)*` in the Words column and the action(s) in the Action column

#### Scenario: Multi-action phrase uses continuation rows

- **WHEN** a single narration phrase corresponds to multiple sequential actions (e.g., "Save the changes" → click save, then click confirm)
- **THEN** the first row has the phrase in Words and the first action in Action, and subsequent rows have empty Words cells with the remaining actions

#### Scenario: Script matches proposal scenes

- **WHEN** the agent generates script.md from an approved proposal
- **THEN** the script contains one scene section per scene listed in the proposal, with beats detailing the choreography

#### Scenario: Every beat has a matching timing marker

- **WHEN** the agent generates both script.md and demo.spec.ts
- **THEN** every marker ID referenced in a beat heading exists as a `mark()` call in the Playwright script

### Requirement: demo.spec.ts is an executable Playwright test with timing markers

Each demo's `demo.spec.ts` SHALL be a valid Playwright test file that:
1. Defines a `mark()` helper at the top that emits `DEMOFLY|scene|action|target|elapsed-ms` via console.log
2. Emits markers at every meaningful action (clicks, type start/end, wait completions, hovers, navigations, pauses, scene boundaries)
3. Uses human-like interaction patterns (pressSequentially, distance-based cursor delay, fake DOM cursor)
4. Includes appropriate timeouts for long-running recordings

#### Scenario: Spec file runs as a Playwright test

- **WHEN** the user runs `npx playwright test demofly/<name>/demo.spec.ts --config demofly/<name>/playwright.config.ts`
- **THEN** the test executes and produces a video recording

#### Scenario: Console output contains timing markers

- **WHEN** the Playwright test completes
- **THEN** the console output contains `DEMOFLY|` prefixed lines for every scene boundary and interaction

### Requirement: timing.json is extracted from recording output

After a successful recording, the agent SHALL parse the Playwright console output to extract all `DEMOFLY|` markers and write `recordings/timing.json` containing:
- Total duration in milliseconds
- An array of scenes, each with: scene ID, title, start_ms, end_ms
- Within each scene, an array of markers with: action, target, and ms (elapsed from demo start)

#### Scenario: Timing data extracted after recording

- **WHEN** the Playwright test passes and produces a recording
- **THEN** the agent parses console output and writes `demofly/<name>/recordings/timing.json`

#### Scenario: Timing JSON has action-level granularity

- **WHEN** timing.json is generated
- **THEN** each scene contains individual markers for clicks, typing, waits, and other actions — not just scene start/end

### Requirement: transcript.md is generated on request with actual timing

When the user requests narration, the agent SHALL generate `transcript.md` AFTER recording. It SHALL contain the raw narration text extracted from script.md beats, annotated with:
- TTS-compatible emotion and pacing tags (e.g., `[warmly]`, `[pause: 0.5s]`)
- Actual beat timing windows from timing.json
- Estimated narration read time per beat

The transcript SHALL be organized per-beat (matching script.md beat numbering) so that TTS generation can produce one audio clip per beat.

#### Scenario: Transcript includes per-beat timing

- **WHEN** the agent generates transcript.md after a successful recording
- **THEN** each beat section includes the actual timestamp from timing.json and the available time window until the next beat

#### Scenario: Transcript contains only narration text

- **WHEN** the agent generates transcript.md
- **THEN** it contains spoken text with TTS tags only — no action descriptions, no sync tables, no interaction steps

#### Scenario: Silent beats are omitted from transcript

- **WHEN** a beat in script.md has no narration (silent beat)
- **THEN** that beat does not appear in transcript.md

### Requirement: Artifacts enable programmatic audio-video stitching

The combination of `recordings/video.webm` (or .mp4), `recordings/timing.json`, and `transcript.md` SHALL contain sufficient information for constructing an ffmpeg command that overlays **per-beat** narration audio onto the video at the correct timestamps.

Each beat's audio clip SHALL be positioned using the beat's marker timestamp from timing.json as the `adelay` value. Silent beats (no narration) SHALL produce no audio input.

#### Scenario: Per-beat stitching with ffmpeg

- **WHEN** the user provides per-beat audio files and asks to stitch
- **THEN** the agent uses timing.json to look up each beat's marker timestamp and constructs an ffmpeg command with one audio input per beat, each delayed to its marker time

#### Scenario: Variable API timing handled gracefully

- **WHEN** an API call during recording takes longer than expected, shifting subsequent marker timestamps
- **THEN** each beat's audio is still correctly positioned because stitching uses actual marker timestamps, not estimated offsets
