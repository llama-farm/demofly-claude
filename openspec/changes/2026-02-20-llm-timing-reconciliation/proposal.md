# Proposal: LLM-Based timing.json Reconciliation

## Problem

The demo-engineer agent generates `timing.json` from Playwright console output, but the field names are unpredictable. The CLI's `TimingData` interface expects exact camelCase fields (`totalDuration`, `sceneId`, `startMs`, `endMs`), but the LLM might produce snake_case, different names entirely, or other variations. A deterministic remap script only handles known mismatches — it can't handle arbitrary LLM output.

## Solution

Two-layer fix in the plugin:

### 1. Stronger Prompt Engineering (SKILL.md)
- Add explicit anti-pattern section showing wrong vs right field names
- Make the extraction script the canonical path (don't imply manual JSON writing is ok)
- Add a golden-reference timing.json example with inline comments

### 2. LLM Reconciliation Step (demo-engineer.md)
- Add a mandatory step between timing extraction and TTS/transcript generation
- The agent reads the generated timing.json, then prompts Claude with:
  - The exact `TimingData` TypeScript interface
  - A correct example
  - The generated file
  - Instructions to normalize to the correct schema
- The agent writes the corrected output back
- This handles ANY naming variation, not just snake_case

### Why LLM, Not Script?
- LLM output is inherently non-deterministic — the field names could be anything
- A deterministic script only handles cases you've already seen
- An LLM can understand intent and normalize regardless of naming convention
- It's a two-pass approach: first LLM generates, second LLM validates/fixes

## Specs Affected
- `demo-workflow-skill` — add reconciliation requirement
- `demo-agent` — add reconciliation phase to agent workflow

## Implementation
- Update `plugins/demofly/skills/demo-workflow/SKILL.md` — anti-patterns, stronger examples
- Update `plugins/demofly/agents/demo-engineer.md` — replace deterministic Phase 6.5 with LLM reconciliation
- Update specs to match
