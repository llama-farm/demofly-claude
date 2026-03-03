## 1. Plugin Scaffold & Marketplace

- [x] 1.1 Create `.claude-plugin/marketplace.json` at repo root listing the demofly plugin with name, description, and source path
- [x] 1.2 Create `plugins/demofly/.claude-plugin/plugin.json` with name "demofly", description, and version "0.1.0"
- [x] 1.3 Create the plugin directory structure: `plugins/demofly/commands/`, `plugins/demofly/agents/`, `plugins/demofly/skills/demo-workflow/`

## 2. Commands

- [x] 2.1 Create `plugins/demofly/commands/create.md` — the `/demofly:create [name]` command that checks Playwright MCP availability, infers demo state from file existence, and walks the user through the pipeline (exploration → proposal → script → Playwright gen → record → optional narration)
- [x] 2.2 Create `plugins/demofly/commands/list.md` — the `/demofly:list` command that scans `demofly/` for demo subdirectories and shows each demo's phase based on which files exist

## 3. Demo Engineer Agent

- [x] 3.1 Create `plugins/demofly/agents/demo-engineer.md` with agent frontmatter and system prompt covering: orchestration role, when to delegate to Explore and general-purpose sub-agents, parallel exploration strategy, verify-fix-rerun loop, and context window management via delegation

## 4. Demo Workflow Skill

- [x] 4.1 Create `plugins/demofly/skills/demo-workflow/SKILL.md` — Section 1: artifact pipeline overview (context.md → proposal.md → script.md → demo.spec.ts → recordings/ → timing.json → transcript.md) with format descriptions for each
- [x] 4.2 Add to SKILL.md — Section 2: timing marker system (the `mark()` helper pattern, `DEMOFLY|scene|action|target|ms` format, full marker vocabulary, and timing.json extraction instructions)
- [x] 4.3 Add to SKILL.md — Section 3: human-like interaction patterns (pressSequentially at ~35ms, distance-based cursor delay formula, fake DOM cursor injection JavaScript, natural pause placement)
- [x] 4.4 Add to SKILL.md — Section 4: Playwright recording configuration (playwright.config.ts template with video on, 1280x800 viewport, extended timeouts)
- [x] 4.5 Add to SKILL.md — Section 5: sub-agent delegation strategy (parallel exploration with Explore + general-purpose agents, debugging delegation, what to pass to sub-agents, how to synthesize results)
- [x] 4.6 Add to SKILL.md — Section 6: script.md format with sync notes (per-scene structure: scene ID, target duration, narration text, interaction sequence, sync table mapping narration phrases to marker IDs)
- [x] 4.7 Add to SKILL.md — Section 7: transcript and stitching (record-first-narrate-second approach, transcript.md format with TTS tags and actual durations from timing.json, ffmpeg stitching pattern for overlaying per-scene audio at marker-derived offsets)
