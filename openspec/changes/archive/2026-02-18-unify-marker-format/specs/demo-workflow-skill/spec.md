## MODIFIED Requirements

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
