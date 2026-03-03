## Context

This repo (`demofly`) is a greenfield Claude Code plugin marketplace. It will contain a single plugin (`demofly`) that automates demo video generation for web applications. The approach was validated manually on the AF Performance Review Assistant project (see DEMO-REPORT.md), where an 8-step process produced a 3-minute demo video with narration in a single day. This change makes that process generic and packages it as an installable plugin.

The plugin targets Claude Code users who have a running web app and want to produce a polished demo video without manual screen recording or video editing.

## Goals / Non-Goals

**Goals:**
- A functional Claude Code plugin marketplace with one plugin
- A single `/demofly:create [name]` command that walks through the full pipeline
- Parallel codebase + UI exploration via sub-agents to keep context lean
- Granular action-level timing markers in Playwright scripts for audio-video sync
- Artifacts sufficient to stitch narration audio onto video programmatically
- Human-like recording quality (typing delays, cursor animation, natural pacing)

**Non-Goals:**
- Demo templates or formulaic narrative structures
- Application startup or environment management (user provides a running app URL)
- Demo data seeding (user prepares app state beforehand)
- Redo/edit UX for individual scenes (post-MVP)
- Non-web-app demos (CLI, mobile, desktop)
- Built-in TTS audio generation (transcript is produced; audio generation is external)
- Multiple plugins in the marketplace (future)

## Decisions

### 1. One orchestrator agent, built-in sub-agent types for delegation

**Decision:** Define a single `demo-engineer` agent in the plugin. For codebase exploration, UI browsing, and debugging, delegate to Claude Code's built-in sub-agent types (`Explore`, `general-purpose`).

**Rationale:** The original process blurred the lines between exploration, building, and debugging constantly. Narrow agent definitions would create artificial handoff friction. One orchestrator that knows when to delegate keeps the workflow fluid. Built-in sub-agent types already have the right tool access — no need to redefine them.

**Alternative considered:** Separate agents for explorer, builder, debugger. Rejected because the phases are too interleaved in practice.

### 2. Parallel sub-agents during exploration

**Decision:** During discovery, the orchestrator SHALL launch codebase exploration (Explore agent) and UI exploration (general-purpose agent with Playwright MCP) in parallel.

**Rationale:** These are independent — static code analysis and dynamic browser interaction inform each other but don't depend on each other. Running in parallel cuts discovery time roughly in half and prevents either result set from bloating the parent context. The parent receives two concise summaries and synthesizes them into context.md.

### 3. Shared context.md at demofly root, refreshed lazily

**Decision:** Product understanding lives in `demofly/context.md`, shared across all demos. On each `/demofly:create` invocation, the agent reads context.md, does a quick sanity check against the running app, and updates if stale. If context.md doesn't exist, the full exploration runs.

**Rationale:** Eliminates redundant exploration for the second, third, Nth demo. Staleness is handled by checking the live app, not by timestamps or version tracking.

**Alternative considered:** Per-demo discovery documents. Rejected because product knowledge is shared — pages, routes, stack don't change between demos.

### 4. File existence as state

**Decision:** Demo phase is inferred from which files exist in the demo subdirectory. No manifest, no YAML config, no state database.

**Rationale:** Simplest possible state management. `proposal.md` exists means proposal is done. `demo.spec.ts` exists means the script has been generated. The agent reads the directory listing and picks up wherever the user left off. If a user deletes a file, the agent re-creates it. Zero additional infrastructure.

### 5. Granular action-level timing markers

**Decision:** The Playwright script emits `DEMOFLY|scene|action|target|ms` markers via `console.log` at every meaningful interaction point (clicks, typing start/end, wait completions, hovers, navigations, pauses). After recording, these are parsed into `timing.json`.

**Rationale:** Scene-level markers are too coarse for narration alignment. A narrator saying "Watch as the AI analyzes..." needs to land when the loading spinner appears, not just somewhere in the scene. Action-level granularity enables precise ffmpeg-based stitching without manual timing work.

**Marker vocabulary:** `click`, `type-start`, `type-end`, `wait-start`, `wait-end`, `hover`, `scroll`, `navigate`, `pause`, `start`, `end`.

### 6. Record first, narrate second

**Decision:** The video is recorded first. Actual scene and action timing is extracted from the recording. The transcript is then generated with real durations so narration can be produced to fit the video, not the other way around.

**Rationale:** Playwright execution has variable timing (network, animations, AI responses). Pre-scripted narration will never align with actual video timing. Recording first gives us ground truth, then narration is shaped to match.

### 7. script.md as the master document with sync notes

**Decision:** `script.md` contains per-scene narration text, interaction descriptions, and sync notes that reference specific timing markers. This is the single source of truth that both the Playwright code and the transcript derive from.

**Rationale:** Having narration and interactions in one document makes it easy for the agent (and humans) to reason about alignment. The sync notes explicitly map narration phrases to marker IDs, removing ambiguity during stitching.

### 8. Playwright MCP as a required external dependency

**Decision:** The plugin does not bundle Playwright. It checks for Playwright MCP availability at command start and guides installation if missing.

**Rationale:** Playwright MCP is a separate Claude Code plugin with its own installation and browser management. Bundling it would be fragile and duplicative. Checking and guiding is the standard plugin pattern for dependencies.

## Risks / Trade-offs

**[Playwright selector fragility]** Different UI frameworks (Radix, MUI, Ant Design, custom) render interactive elements differently. Selectors that work during interactive exploration may fail during test execution.
→ The skill instructs the agent to prefer accessible selectors (roles, labels, text) over CSS selectors. The verify-fix-rerun loop catches failures. The context.md notes UI framework specifics that affect selector strategy.

**[Context compression during long sessions]** A full demo generation may take 50+ tool calls, triggering context compression.
→ Sub-agent delegation keeps the parent context lean. All critical information lives on disk (context.md, proposal.md, script.md) and can be re-read after compression.

**[Variable recording timing]** Demo duration is unpredictable due to network latency, AI feature response time, animation durations.
→ The record-first-narrate-second approach handles this. Target durations in the proposal are guidance, not guarantees.

**[Playwright test execution timeout]** A 3-minute demo takes 3+ minutes to record. Default Bash timeout is 2 minutes.
→ The skill instructs the agent to set explicit timeouts (up to 10 minutes) on recording commands.

**[User must visually verify]** Claude cannot watch the recorded video to confirm quality.
→ The agent verifies programmatically (test pass/fail, timing markers, file existence/size) and explicitly tells the user to watch the recording for visual QA.
