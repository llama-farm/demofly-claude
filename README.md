# Demofly — Claude Code Plugin

DemoFly turns your product into a polished demo video in minutes — no recording, no editing, no scripting. Just point it at your app, and DemoFly automatically navigates your product, captures every screen, and generates a professional voiceover that walks viewers through the experience. All AI, zero effort.

## Installation

Add the Demofly marketplace and install the plugin:

```
/plugin marketplace add llama-farm/demofly-claude
/plugin install demofly@demofly-marketplace
```

## Requirements

- [Playwright MCP plugin](https://github.com/anthropics/claude-code) for browser automation
- Node.js 20+
- `@playwright/test` (installed automatically when recording)

## Usage

### Create a demo

```
/demofly:create <demo-name>
```

The agent walks through a multi-phase pipeline:

1. **Explore** — Analyzes your codebase and running app to build product context
2. **Propose** — Designs a scene-by-scene narrative for your approval
3. **Script** — Writes beat-centric narration paired with interaction steps
4. **Implement** — Generates a Playwright test with human-like interactions and timing markers
5. **Record** — Runs the test, captures video, extracts timing data
6. **Narrate** (optional) — Generates a TTS-ready narration transcript synced to the recording

### List demos

```
/demofly:list
```

Shows all demos in the project and their current phase (initialized, proposed, scripted, built, recorded, narrated).

## Plugin Structure

```
plugins/demofly/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── agents/
│   └── demo-engineer.md         # Orchestration agent
├── commands/
│   ├── create.md                # /demofly:create command
│   └── list.md                  # /demofly:list command
├── skills/
│   └── demo-workflow/
│       └── SKILL.md             # Core workflow reference (artifact formats, timing, patterns)
└── templates/
    └── helpers.ts               # Shared Playwright helpers (createMarker, moveTo, injectCursor)
```

## Artifact Pipeline

Each demo produces a chain of artifacts stored in `demofly/<name>/`:

| Artifact | Purpose |
|----------|---------|
| `context.md` | Product understanding (shared across demos) |
| `proposal.md` | Scene outline — user approval checkpoint |
| `script.md` | Beat-centric narration + interaction script |
| `demo.spec.ts` | Executable Playwright test with timing markers |
| `playwright.config.ts` | Recording configuration |
| `recordings/timing.json` | Extracted timing data from DEMOFLY markers |
| `transcript.md` | Optional narration transcript with TTS tags |

## Examples

See [`examples/quicknotes/`](examples/quicknotes/) for a complete working example of the full artifact pipeline. It includes a minimal QuickNotes app with all demo artifacts (context, proposal, script, Playwright spec) plus sample expected outputs (timing.json, transcript.md).

## License

MIT
