# Design: LLM-Based timing.json Reconciliation

## SKILL.md Changes

### New Section: "⛔ Anti-Patterns" (after timing.json extraction section)

Add explicit examples of wrong vs right output:

```
⛔ WRONG: { "total_duration_ms": 25672, "scenes": [{ "id": "scene-1", "start_ms": 0, "end_ms": 13675 }] }
✅ RIGHT: { "totalDuration": 25672, "scenes": [{ "sceneId": "scene-1", "startMs": 0, "endMs": 13675 }] }
```

Also show less obvious mistakes:
```
⛔ WRONG: { "duration": 25672, "scenes": [{ "scene_id": "scene-1", "begin": 0, "finish": 13675 }] }
⛔ WRONG: { "totalDurationMs": 25672, "scenes": [{ "name": "scene-1", "from": 0, "to": 13675 }] }
```

### Strengthen extraction script documentation

Add a comment block to the extraction script: "This script is the ONLY supported way to produce timing.json. Do not write timing.json manually."

## demo-engineer.md Changes

### Replace Phase 6.5 (deterministic script) with LLM Reconciliation

The new Phase 6.5 instructs the agent to:

1. Read the generated `timing.json`
2. Read the canonical `TimingData` interface definition (provided inline in the agent doc)
3. Prompt itself (or a sub-agent) with both, asking it to normalize the JSON to match the interface exactly
4. Write the corrected JSON back to `timing.json`

The prompt template:

```
Here is a timing.json file generated from a Playwright recording:

<generated_json>
{content of timing.json}
</generated_json>

It MUST conform to this exact TypeScript interface:

interface TimingMarker {
  action: string;
  target: string;
  ms: number;
}

interface TimingScene {
  sceneId: string;
  startMs: number;
  endMs: number;
  markers: TimingMarker[];
}

interface TimingData {
  totalDuration: number;
  scenes: TimingScene[];
}

Rules:
- Field names must be exact camelCase as shown in the interface
- All numeric values must be numbers (not strings)
- scenes must be an array, each with sceneId, startMs, endMs, markers
- markers must be an array of {action, target, ms}
- Preserve all data — only rename/restructure fields to match the interface
- If a field is clearly the same data under a different name, map it

Return ONLY the corrected JSON, no explanation.
```

5. The agent validates the returned JSON parses correctly, then writes it

## Spec Updates

### demo-workflow-skill/spec.md — New Requirement

```
### Requirement: Skill warns against common timing.json field name mistakes

The skill SHALL include an explicit anti-patterns section showing examples of
incorrect field naming (snake_case, alternative names) alongside the correct
camelCase format. This section reinforces the correct schema through negative
examples.
```

### demo-agent/spec.md — New Requirement

```
### Requirement: Agent reconciles timing.json via LLM before TTS

After extracting timing.json and before TTS/transcript generation, the agent SHALL
perform an LLM-based reconciliation step. The agent reads the generated timing.json,
prompts Claude with the exact TimingData interface and the generated content, and
asks it to normalize the JSON to match the interface. The corrected output is written
back. This handles arbitrary field naming variations, not just known snake_case patterns.
```

## Tasks

1. Update `openspec/specs/demo-workflow-skill/spec.md` — add anti-patterns requirement
2. Update `openspec/specs/demo-agent/spec.md` — add LLM reconciliation requirement
3. Update `plugins/demofly/skills/demo-workflow/SKILL.md` — add anti-patterns section, strengthen examples
4. Update `plugins/demofly/agents/demo-engineer.md` — replace deterministic Phase 6.5 with LLM reconciliation
5. Commit on `fix/timing-json-schema-mismatch` branch, update PR #2
