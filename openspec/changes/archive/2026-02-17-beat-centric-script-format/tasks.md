## 1. Update SKILL.md — Script Format Section

- [x] 1.1 Rewrite SKILL.md Section 6 (lines 596-723) to define the beat-centric script.md format: beat headings with marker IDs, Words/Action tables, silent beats, static beats, continuation rows, format rules, and a complete multi-scene example
- [x] 1.2 Update the "Writing Good Narration" subsection to reflect per-beat narration guidance instead of per-scene blob guidance

## 2. Update SKILL.md — Transcript and Stitching Section

- [x] 2.1 Rewrite SKILL.md Section 7 transcript.md format (lines 742-774) to organize transcript per-beat instead of per-scene, with beat numbering matching script.md
- [x] 2.2 Rewrite SKILL.md Section 7 stitching guidance (lines 821-883) to use per-beat adelay from marker timestamps instead of per-scene adelay from scene start_ms
- [x] 2.3 Update SKILL.md Section 7 intra-scene alignment subsection (lines 885-898) — this becomes unnecessary with per-beat stitching; replace with a note that per-beat markers make intra-scene alignment the default behavior

## 3. Update demo-artifacts spec

- [x] 3.1 Update `openspec/specs/demo-artifacts/spec.md` requirement "script.md is the master document" to define the beat-centric format with scenarios for beat structure, silent beats, multi-action continuation, and marker matching
- [x] 3.2 Update `openspec/specs/demo-artifacts/spec.md` requirement "transcript.md is generated on request" to reflect per-beat organization
- [x] 3.3 Update `openspec/specs/demo-artifacts/spec.md` requirement "Artifacts enable programmatic audio-video stitching" to specify per-beat adelay stitching

## 4. Update demo-workflow-skill spec

- [x] 4.1 Update `openspec/specs/demo-workflow-skill/spec.md` requirement "Skill defines the demo generation pipeline" to reference beat-centric script format and per-beat stitching

## 5. Update demo-engineer agent

- [x] 5.1 Update `plugins/demofly/agents/demo-engineer.md` Phase 3 (Script) description to reference beat-centric format instead of narration/interactions/sync blocks
- [x] 5.2 Update `plugins/demofly/agents/demo-engineer.md` Phase 7 (Narration) description to reference per-beat transcript organization

## 6. Update create command

- [x] 6.1 Update `plugins/demofly/commands/create.md` Step 5 (Script Generation) to show beat-centric script format template instead of narration/interactions/sync blocks
- [x] 6.2 Update `plugins/demofly/commands/create.md` Step 8 (Narration) to reference per-beat transcript format
