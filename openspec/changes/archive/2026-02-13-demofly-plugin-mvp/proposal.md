## Why

There's no automated way to produce a demo video from a web application codebase. Today, creating a product demo requires manual screen recording, voiceover, and editing. We built a one-off process for the AF Performance Review Assistant (documented in DEMO-REPORT.md) that used Claude Code + Playwright to generate a demo video with narration in a single day. That process worked but was entirely hand-crafted for one product. This change builds a generic, reusable Claude Code plugin that lets anyone generate a demo video from their web app.

## What Changes

- Create a Claude Code plugin marketplace structure (this repo) with the `demofly` plugin as its first entry
- The plugin provides a `/demofly:create [name]` command that orchestrates the full demo generation pipeline: codebase exploration, demo proposal, script writing, Playwright code generation, recording, and optional narration
- A `/demofly:list` command to show existing demos and their completion status
- A `demo-engineer` agent that orchestrates the workflow, delegating heavy exploration and debugging to built-in sub-agents (Explore, general-purpose) in parallel where possible
- A `demo-workflow` skill containing core knowledge: artifact formats, granular timing markers, human-like interaction patterns, Playwright recording techniques, and the sub-agent delegation strategy
- Demo artifacts are written to a `demofly/` directory in the user's project, with subdirectories per demo
- A shared `demofly/context.md` captures product understanding across demos, refreshed lazily when stale
- Playwright scripts emit granular action-level timing markers (`DEMOFLY|scene|action|target|ms`) enabling precise audio-video sync
- After recording, a `timing.json` is extracted from marker data, providing the sync map needed to stitch narration audio onto the video with ffmpeg
- Playwright MCP is a required dependency; the plugin detects its absence and guides installation

## Capabilities

### New Capabilities
- `plugin-scaffold`: Marketplace structure (marketplace.json) and plugin manifest (plugin.json) with proper directory layout
- `demo-commands`: The `/demofly:create` and `/demofly:list` slash commands
- `demo-agent`: The `demo-engineer` orchestrator agent definition
- `demo-workflow-skill`: The core skill with artifact formats, timing marker patterns, human-like interaction techniques, Playwright recording patterns, and sub-agent delegation guidance
- `demo-artifacts`: The artifact pipeline (context.md, proposal.md, script.md, demo.spec.ts, playwright.config.ts, timing.json, transcript.md) — their formats, relationships, and generation logic

### Modified Capabilities

(none — greenfield project)

## Impact

- **New files**: Plugin manifest, marketplace manifest, 2 commands, 1 agent, 1 skill
- **Dependencies**: Requires Playwright MCP plugin installed in the user's Claude Code environment
- **User's project**: Creates a `demofly/` directory with demo subdirectories and artifacts
- **External services**: Optional TTS integration (ElevenLabs or other) for narration; ffmpeg for video conversion and audio stitching
