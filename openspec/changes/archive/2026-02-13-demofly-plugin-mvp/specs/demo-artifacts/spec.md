## ADDED Requirements

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

Each demo's `script.md` SHALL contain per-scene sections with:
1. Scene ID and target duration
2. Narration text (what gets spoken during the scene)
3. Interaction sequence (what happens on screen)
4. Sync notes mapping specific narration phrases to timing marker IDs (e.g., `scene-3:wait-end:suggestions-loaded`)

The sync notes SHALL use the same marker IDs that appear in the Playwright script's `DEMOFLY|...` console logs.

#### Scenario: Script has sync notes referencing markers

- **WHEN** the agent generates script.md
- **THEN** each scene includes a sync table mapping narration phrases to marker IDs

#### Scenario: Script matches proposal scenes

- **WHEN** the agent generates script.md from an approved proposal
- **THEN** the script contains one section per scene listed in the proposal

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

When the user requests narration, the agent SHALL generate `transcript.md` AFTER recording. It SHALL contain per-scene narration text with:
- TTS-compatible tags (e.g., ElevenLabs emotion/intonation tags)
- Actual scene duration from timing.json (not estimated targets)
- Estimated narration read time per scene

The transcript SHALL be generated after recording so it reflects actual video timing.

#### Scenario: Transcript includes actual durations

- **WHEN** the agent generates transcript.md after a successful recording
- **THEN** each scene section includes the actual duration from timing.json

#### Scenario: No transcript without user request

- **WHEN** the recording completes and the user has not asked for narration
- **THEN** no transcript.md is generated

### Requirement: Artifacts enable programmatic audio-video stitching

The combination of `recordings/video.webm` (or .mp4), `recordings/timing.json`, and `transcript.md` SHALL contain sufficient information for Claude to construct an ffmpeg command that overlays per-scene narration audio onto the video at the correct timestamps.

#### Scenario: Stitching with ffmpeg

- **WHEN** the user provides per-scene audio files and asks to stitch
- **THEN** the agent uses timing.json to determine audio placement offsets and constructs an ffmpeg command that produces a final video with synced narration
