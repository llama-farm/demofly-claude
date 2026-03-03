## Why

Marker IDs appear as `scene-2:click:create-btn` in script.md beat headings and as `DEMOFLY|scene-2|click|create-btn|1234` in console output. Agents see two formats and assume it's a bug. In reality, colons in beat headings are compact shorthand for the three arguments passed to `mark(scene, action, target)`, which emits pipe-delimited console output. This isn't documented anywhere — it should be.

## What Changes

- Add a brief note to SKILL.md Section 6 (beat heading format) explaining that the colon-delimited form is shorthand referencing the three `mark()` arguments, and that console output uses pipes
- That's it. One paragraph. No code changes.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `demo-workflow-skill`: Add a note in the beat heading format section clarifying the colon vs pipe convention

## Impact

- `plugins/demofly/skills/demo-workflow/SKILL.md` — Section 6 only: add one explanatory paragraph
- No code changes, no other files affected
- `demo-artifacts` spec already documents that beat heading marker IDs must match `mark()` calls — this just explains the delimiter difference
