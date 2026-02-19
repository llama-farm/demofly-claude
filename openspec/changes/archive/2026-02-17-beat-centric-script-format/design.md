## Context

The current `script.md` format stores narration text, interaction steps, and sync mappings as three separate blocks per scene. The stitching pipeline aligns narration audio to video at scene-level granularity (one audio clip per scene, positioned at the scene's `start_ms`). Intra-scene alignment requires manual workarounds (splitting scene audio or prepending silence).

The demo-workflow SKILL.md (919 lines) is the authoritative reference for all artifact formats. The demo-engineer agent and create command reference SKILL.md indirectly. The demo-artifacts spec defines the requirements. Changes must update both the spec (what) and the skill (how).

## Goals / Non-Goals

**Goals:**
- Replace the three-block-per-scene script format with a beat-centric structure where narration and actions are co-located
- Enable per-beat audio stitching for precise narration alignment
- Make silent moments and static narration explicit rather than implicit gaps
- Support multi-action sequences within a single narration phrase
- Keep the format human-readable and agent-parseable

**Non-Goals:**
- Changing the timing marker format (`DEMOFLY|...|...|...|...`) — it stays as-is
- Changing timing.json structure — it already has action-level markers
- Changing the Playwright code generation approach — demo.spec.ts structure is unaffected
- Building tooling to parse the new format — it's consumed by agents reading markdown
- Changing the proposal.md format — scene-level planning is fine; beat-level detail belongs in script.md

## Decisions

### Decision 1: The atomic unit is a "beat", not a table row

A beat groups a narration fragment (1-3 sentences) with its ordered actions and a timing marker. This is the natural unit for TTS generation — each beat produces one audio clip with natural prosody.

**Alternative considered:** Pure row-level (one phrase ↔ one action). Rejected because it would produce choppy TTS fragments and doesn't naturally handle compound narration like "Give it a name, set a deadline, and assign a team lead" which is one spoken breath.

**Alternative considered:** Keep scene-level narration blocks. Rejected because this is the current format's core problem — narration and actions are disconnected.

### Decision 2: Beats use a Words/Action table, not a definition list

Each beat contains a markdown table with `Words` and `Action` columns. Multi-action sequences use continuation rows (empty Words cell). This format is:
- Visually clear (tabular alignment)
- Machine-parseable (standard markdown table)
- Compact (no heading-per-action overhead)

**Alternative considered:** Definition lists (`**Say:** ... **Do:** ...`). More verbose, harder to scan, and less natural for multi-action continuation.

### Decision 3: Silent and static beats are explicit

- **Silent beat**: Empty Words column, actions only. Marked with `*(silence — description)*` in the Words cell for readability.
- **Static beat**: Words with no actions. The screen is static while narration plays.

These serve as natural boundaries for TTS audio clip splitting — a silent beat means "no audio clip here."

### Decision 4: Beat headings carry the marker ID inline

Format: `### 2.3 — Submit  → \`scene-2:click:create-btn\``

The marker ID is right in the heading so it's visible when scanning the document. The numbering scheme is `{scene}.{beat}` (e.g., 2.3 = scene 2, beat 3).

### Decision 5: Stitching shifts to per-beat adelay

The ffmpeg stitching command uses one audio input per beat (not per scene). Each beat's audio is positioned at the beat's marker timestamp from timing.json. Silent beats produce no audio input.

This is a documentation change in SKILL.md Section 7. The existing ffmpeg approach scales — it's just more `-i` inputs and more `adelay` entries.

### Decision 6: transcript.md becomes post-recording narration text with TTS tags

After recording, transcript.md is generated from the script.md beats plus actual timing from timing.json. It contains:
- Per-beat narration text with TTS emotion/pacing tags
- Actual timing windows (from timing.json markers)
- Estimated read times

It does NOT duplicate the beat structure or sync mapping — that lives in script.md.

## Risks / Trade-offs

**[More complex script generation]** → The agent writing script.md must now think at beat granularity, not just scene-level narration blobs. Mitigated by providing a thorough example in SKILL.md and clear format rules.

**[More audio clips to manage]** → A 3-minute demo might produce 25-35 audio clips instead of 8. Mitigated by the fact that TTS APIs handle short clips well, and ffmpeg can mix many inputs without issue. The user has confirmed this is not a concern.

**[Format migration]** → Existing demos (like the 001 training example) use the old format. No migration needed — old demos keep their format, new demos use the new format. The SKILL.md update only affects future generation.

**[Marker coverage]** → Per-beat stitching requires every beat to have a corresponding marker in demo.spec.ts. If a marker is missing, the beat's audio can't be positioned. Mitigated by making it a hard rule: every beat heading must reference a marker that exists in the Playwright script.
