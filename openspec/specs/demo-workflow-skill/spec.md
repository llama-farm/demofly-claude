## Purpose

Defines the demo-workflow skill that guides agents through the full demo generation pipeline.
## Requirements
### Requirement: Skill defines the demo generation pipeline

The `demo-workflow` skill SHALL describe the full demo generation pipeline that the agent follows: exploration, proposal, script, Playwright code generation, recording and verification, and optional narration. The pipeline is guidance, not rigid — the agent adapts based on user input and existing artifacts.

The skill's script.md format section SHALL define the **beat-centric format** where each scene is composed of numbered beats. Each beat pairs a narration fragment with ordered actions via a Words/Action table, and carries a timing marker ID in its heading.

The skill's transcript and stitching section SHALL describe **per-beat audio generation and stitching**, where each beat produces one TTS audio clip positioned at its marker timestamp.

#### Scenario: Agent follows pipeline for new demo

- **WHEN** the demo-engineer agent starts a new demo with no existing artifacts
- **THEN** it follows the pipeline from exploration through recording, consulting the skill for artifact formats and techniques at each phase

#### Scenario: Skill documents beat format with complete example

- **WHEN** an agent reads the skill's script.md format section
- **THEN** it finds a complete multi-scene example using beats with Words/Action tables, including silent beats, static beats, and multi-action continuation rows

#### Scenario: Skill documents per-beat stitching

- **WHEN** an agent reads the skill's stitching section
- **THEN** it finds instructions for constructing ffmpeg commands with one audio input per beat, using marker timestamps for adelay values

### Requirement: Skill defines human-like interaction patterns

The skill SHALL instruct the agent to generate Playwright scripts with human-like behavior:
- Text input via `pressSequentially()` at approximately 35ms per keystroke
- Distance-based mouse movement delay calculated from element bounding box coordinates
- A fake DOM cursor (CSS-animated dot injected via JavaScript) since Playwright's OS cursor does not appear in video recordings
- Natural pauses after significant actions to let the viewer absorb what happened

#### Scenario: Generated Playwright script has human-like typing

- **WHEN** the agent generates a demo.spec.ts that includes text input
- **THEN** the script uses `pressSequentially()` with a delay parameter rather than `fill()`

#### Scenario: Generated Playwright script has fake cursor

- **WHEN** the agent generates a demo.spec.ts
- **THEN** the script includes JavaScript injection that creates a visible animated cursor element in the DOM

### Requirement: Skill defines the timing marker system

The skill SHALL instruct the agent to emit granular timing markers in Playwright scripts using `console.log` with the format `DEMOFLY|<scene-id>|<action>|<target>|<elapsed-ms>`. The marker helper SHALL be defined at the top of the spec and used at every meaningful interaction point.

The marker action vocabulary SHALL include: `start`, `end`, `click`, `type-start`, `type-end`, `wait-start`, `wait-end`, `hover`, `scroll`, `navigate`, `pause`.

The skill's beat heading format section SHALL note that colon-delimited marker IDs in beat headings (e.g. `scene-2:click:create-btn`) are compact shorthand referencing the three arguments passed to `mark(scene, action, target)`, which emits pipe-delimited console output. This prevents agents from treating the two representations as an inconsistency.

#### Scenario: Playwright script emits markers at action granularity

- **WHEN** the agent generates a demo.spec.ts
- **THEN** every click, type, wait, and hover action is bracketed by timing markers

#### Scenario: Markers use elapsed time from demo start

- **WHEN** the Playwright test executes and emits markers
- **THEN** all marker timestamps are milliseconds elapsed since the start of the test, not absolute timestamps

#### Scenario: Agent understands beat heading vs console marker formats

- **WHEN** the agent reads script.md beat headings with colon-delimited marker IDs
- **THEN** it understands these are shorthand for the `mark()` arguments, not a different format from the pipe-delimited console output

### Requirement: Skill defines sub-agent delegation strategy

The skill SHALL instruct the agent to delegate codebase exploration and UI exploration in parallel during the discovery phase, using the Explore and general-purpose built-in sub-agent types respectively. It SHALL instruct the agent to delegate Playwright debugging to sub-agents to keep the parent context lean.

#### Scenario: Skill guides parallel exploration

- **WHEN** the agent reads the skill during the exploration phase
- **THEN** it knows to launch codebase and UI exploration as parallel sub-agents and synthesize results

### Requirement: Skill defines Playwright recording configuration

The skill SHALL instruct the agent to create a `playwright.config.ts` with video recording enabled, a 1280x800 viewport as default, and appropriate test timeout settings for long-running demo recordings (up to 10 minutes). The config template SHALL use `127.0.0.1` instead of `localhost` for the baseURL to avoid DNS resolution issues in headless Chromium environments.

#### Scenario: Recording config enables video capture

- **WHEN** the agent generates playwright.config.ts
- **THEN** the config includes video recording settings with `video: 'on'` and a viewport of 1280x800

#### Scenario: Recording config uses IP literal for baseURL

- **WHEN** the agent generates playwright.config.ts from the skill template
- **THEN** the baseURL uses `127.0.0.1` instead of `localhost`
- **AND** an inline comment explains that IP literals avoid DNS resolution issues in headless browsers

### Requirement: Skill defines the verify-fix-rerun loop

The skill SHALL instruct the agent to run the generated Playwright script, check for failures, and iterate. When a test fails, the agent SHALL delegate debugging to a sub-agent, apply fixes, and re-run. The agent SHALL set an explicit Bash timeout of at least 600000ms for recording commands.

#### Scenario: Test passes on first run

- **WHEN** the agent runs the Playwright script and it passes
- **THEN** the agent proceeds to extract timing data and report success

#### Scenario: Test fails and gets fixed

- **WHEN** the agent runs the Playwright script and it fails
- **THEN** the agent delegates debugging to a sub-agent, applies the recommended fixes, and re-runs the test

