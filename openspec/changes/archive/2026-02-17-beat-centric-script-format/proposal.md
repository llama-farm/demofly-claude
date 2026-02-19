## Why

The current `script.md` format stores narration, interactions, and sync mappings as three parallel structures per scene. This forces consumers (agents, stitching logic) to mentally "zip" them together to understand choreography. Stitching currently aligns audio only at scene boundaries, making intra-scene alignment a manual hack. When APIs or page loads take longer than expected, there's no structured way to know which narration fragment is affected or where silence should go.

## What Changes

- **Redesign `script.md` around "beats"** — the atomic unit that pairs a narration fragment with its ordered actions and a timing marker. Each scene becomes a sequence of beats instead of three disconnected blocks.
- **Beat-level timing markers** — each beat gets a marker ID, enabling per-beat audio stitching instead of per-scene. This makes narration alignment precise and resilient to variable action durations.
- **Explicit silent and static beats** — beats with no narration (viewer watches an action) and beats with no actions (narration over static screen) are first-class concepts, not implicit gaps.
- **Multi-action continuation rows** — a single narration phrase can map to multiple sequential actions via continuation rows (empty Words cell), supporting compound interactions like "Save the changes" → click save, click confirm.
- **Update `transcript.md` role** — remains a post-recording artifact containing raw narration text with TTS tags, generated from actual timing.json data. No longer needs its own sync mapping since script.md beats already provide the alignment contract.
- **Update stitching guidance** — stitching shifts from per-scene `adelay` to per-beat `adelay`, using each beat's marker timestamp from timing.json.
- **Update SKILL.md** — the demo-workflow skill sections for script.md format, transcript generation, and stitching must reflect the new beat-centric structure.

## Capabilities

### New Capabilities

_(none — this is a format redesign of existing capabilities)_

### Modified Capabilities

- `demo-artifacts`: The `script.md` requirement changes from three-block-per-scene format to beat-centric format. The `transcript.md` and stitching requirements update to support per-beat alignment.
- `demo-workflow-skill`: The skill's script.md format section, transcript section, and stitching section must reflect the new beat-centric structure and per-beat audio alignment.

## Impact

- **SKILL.md** (Section 6: script.md format, Section 7: transcript and stitching) — major rewrite
- **demo-artifacts spec** — requirements for script.md, transcript.md, and stitching update
- **demo-engineer agent** (`agents/demo-engineer.md`) — references to script format in orchestration guidance
- **create command** (`commands/create.md`) — any inline references to script structure
- **No code changes** — this is a documentation/specification change only; no TypeScript or CLI code is affected
