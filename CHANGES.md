# Narrative Improvements Changelog

Branch: `qa/narrative-improvements`
Issues addressed: #6 (P0), #7 (P0), #8 (P1), #9 (P1), #10 (P1), #11 (P2)

## Files Changed

### `plugins/demofly/skills/demo-workflow/SKILL.md`

**Section 6 — Narration Style Guide (was "Writing Good Narration"):**
- **Issue #6:** Expanded from 6 bullet points (~100 words) to a full narration style guide (~500 words) covering:
  - "Narrate the Invisible" core principle with the Mute Test
  - Before/after examples: 7 mirror narration → value narration transformations
  - **Issue #9:** Narration anti-patterns section with 6 named anti-patterns, each with ❌/✅ examples: mirror narration, feature dumping, hedging/filler, Captain Obvious, cliché closers, permission narration
  - Opening patterns that work: pain-point question, surprising contrast, bold claim, story start
  - Pacing and rhythm guidance: sentence length variation, strategic silence, building to peaks, front-loading value
  - **Issue #8:** Multi-beat narration flows — guidance and format for spanning beats with flowing sentences instead of choppy fragments
  - **Issue #10:** Narration Quality Checklist — 8-point checklist (hook test, mute test, value test, wow test, anti-pattern test, closing test, flow test, hero test)

**proposal.md Format section:**
- **Issue #7:** Replaced feature-list proposal format with story-driven narrative arc template:
  - Hook → Problem → Solution / Rising Action → Hero Moment → Payoff structure
  - Explicit guidance: "Start with the audience's pain point, not the product name"
  - **Issue #11:** Hero Scene guidance — concept of ⭐ HERO marker, what it means for each pipeline stage, examples across different product types

**Format Rules section:**
- **Issue #8:** Added rule #7 for multi-beat spanning format
- **Issue #11:** Added hero scene marker format: `## Scene N: Title ⭐ HERO [target: Xs]`

**Complete Example section:**
- Rewrote the TaskFlow demo example to demonstrate all narrative improvements:
  - Opens with pain-point question instead of product definition
  - Uses multi-beat spanning in Scene 2
  - Marks Scene 3 as ⭐ HERO with strategic silence during AI generation
  - Value narration focuses on results ("Ten tasks... Five seconds.") not actions
  - Specific, quantified closer instead of cliché
  - Added annotation explaining what makes the example better

### `plugins/demofly/commands/create.md`

**Step 4 — Proposal:**
- **Issue #7:** Replaced feature-list template with narrative arc template (Hook → Problem → Solution → Hero Moment → Payoff)
- Added guidance: "Start with the audience's pain point, not the product name"
- **Issue #11:** Added requirement to identify exactly one ⭐ HERO scene per proposal

**Step 5 — Script Generation:**
- **Issue #7:** Added narrative-first scripting guidance referencing the Narration Style Guide
- **Issue #8:** Added multi-beat flow format with spanning example
- **Issue #10:** Added instruction to run the Narration Quality Checklist
- **Issue #11:** Added hero scene marker in script format

**Step 8 — Narration:**
- Added narration quality preamble referencing the Style Guide, anti-patterns, hero scene, and quality checklist

### `plugins/demofly/agents/demo-engineer.md`

**Phase 2 — Propose:**
- **Issue #7:** Updated to require narrative arc (Hook → Problem → Solution → Hero Moment → Payoff)
- Added: "Start with the audience's pain point, NOT the product name"
- **Issue #11:** Added ⭐ HERO scene requirement

**Phase 3 — Script:**
- **Issue #7:** Added narrative arc awareness
- **Issue #8:** Added multi-beat narration flow guidance
- **Issue #11:** Added hero scene pacing guidance
- Referenced Narration Style Guide

**Phase 7 — Narration:**
- Restructured into Story Quality and Technical Requirements sections
- Added full Narration Quality Checklist reference (all 8 tests)
- Updated example to show value narration (pain-point hook) instead of mirror narration
- Added anti-pattern and hero scene references

## Summary of Coverage

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| #6 | Expand Narration Guidance | P0 | ✅ Full style guide with examples |
| #7 | Add Narrative Arc Framework | P0 | ✅ Arc template in proposal + script + agent |
| #8 | Beat Structure | P1 | ✅ Multi-beat spanning format |
| #9 | Anti-Patterns | P1 | ✅ 6 named anti-patterns with examples |
| #10 | Quality Checklist | P1 | ✅ 8-point checklist |
| #11 | Hero Scene Concept | P2 | ✅ ⭐ HERO marker + pipeline guidance |
