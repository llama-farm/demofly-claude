## Context

The demofly system has two pipelines that overlap significantly:

1. **Claude Code plugin** (`/demofly:create`) — explores the product, generates proposals/scripts/Playwright code, runs recording, extracts timing, generates optional transcript. Ends after reporting success without producing a final assembled video.
2. **CLI** (`demofly generate`) — runs the Playwright test, parses timing markers, optionally generates TTS audio, stitches audio onto video. Duplicates the recording and timing extraction that Claude Code already does.

The `demofly/<name>/` directory contains all artifacts but is not treated as a shared contract — each pipeline writes its own version of overlapping outputs.

The CLI uses Kokoro TTS via sherpa-onnx-node native bindings (requires Node 22+). This is the one capability that cannot be replicated in Claude Code.

## Goals / Non-Goals

**Goals:**
- Make `demofly generate` an assembler that reads existing artifacts from disk rather than re-running the full pipeline
- Extract TTS into a standalone `demofly tts` subcommand
- Have the Claude Code plugin call `demofly tts` + `demofly generate` at the end of the create workflow
- Preserve the ability to record from the CLI via `--record` flag
- Maintain standalone CLI usability for users who don't use Claude Code

**Non-Goals:**
- Changing how the Claude Code plugin does recording/debugging (Steps 1-7 stay the same)
- Modifying the Kokoro TTS engine itself or changing TTS quality
- Adding new CLI subcommands beyond `tts` (no `demofly stitch` etc.)
- Changing the artifact directory structure or file formats

## Decisions

### Decision 1: `demofly generate` becomes assembler-first with optional `--record`

**Choice**: By default, `generate` discovers artifacts on disk and assembles them. A `--record` flag triggers Playwright recording before assembly.

**Alternatives considered**:
- Separate `demofly assemble` and `demofly record` commands — rejected because it fragments the user experience. Users think in terms of "generate a video", not "assemble artifacts".
- Always require `--record` — rejected because Claude Code already handles recording and just needs assembly.

**Behavior**:
1. Validate `demo.spec.ts` and `playwright.config.ts` exist (always required).
2. If `--record` flag: run Playwright test, extract timing, save video + timing.json.
3. If no `--record`: look for `recordings/video.webm` and `recordings/timing.json`.
4. If video is missing and no `--record`: prompt interactively ("No recording found. Record now?"). In non-interactive mode (piped stdin), exit with error and hint to use `--record`.
5. Check for `audio/*.wav` files. If found, stitch with ffmpeg. If not, convert webm→mp4 (silent video).
6. Output: `recordings/final.mp4`.

### Decision 2: Extract `demofly tts` as standalone subcommand

**Choice**: Move TTS into `demofly tts <project>` that reads `transcript.md` and writes `audio/*.wav`.

**Rationale**: TTS is the only CLI capability that requires native bindings (sherpa-onnx-node). Isolating it makes the dependency boundary clear and lets Claude Code call it as a focused step.

**Interface**:
```
demofly tts <project> [--voice <name>] [--speed <multiplier>]
```
- Reads: `demofly/<project>/transcript.md`
- Writes: `demofly/<project>/audio/scene-1.wav`, `scene-2.wav`, etc.
- Reuses existing `parseTranscript()` and `generateAllAudio()` from `lib/tts.ts`.

### Decision 3: Remove `--narrate` from `demofly generate`

**Choice**: `generate` no longer does TTS. Users run `demofly tts` first, then `demofly generate` assembles whatever audio exists.

**Rationale**: Keeps each command focused. `generate` assembles, `tts` synthesizes. The two can be composed in any order or called independently.

**Migration**: Users who used `demofly generate --narrate <project>` must now run `demofly tts <project> && demofly generate <project>`.

### Decision 4: Node.js version handling in Claude Code

**Choice**: The plugin's create command SHALL use `npx --node 22` or source nvm to ensure Node 22+ when calling demofly CLI commands. The exact mechanism depends on the user's environment.

**Rationale**: The plugin runs in the user's shell via the Bash tool. Since demofly requires Node 22+, the Bash commands must handle version switching. Using nvm is the most common approach, but the command should attempt `demofly` directly first and only use nvm fallback if it fails with a version error.

### Decision 5: Interactive prompting in `demofly generate`

**Choice**: When video artifacts are missing and no `--record` flag is set, `generate` checks if stdin is a TTY. If interactive, prompts the user. If non-interactive, exits with an error message suggesting `--record`.

**Rationale**: Makes the CLI forgiving for manual use while predictable in scripts/automation.

## Risks / Trade-offs

- **[Breaking change]** Removing `--narrate` from `generate` breaks existing workflows. → Mitigation: Clear error message if someone passes `--narrate` ("Did you mean `demofly tts`?"). Document migration in CLI changelog.
- **[Double recording risk]** If Claude Code's recording fails and the user manually runs `demofly generate --record`, they get a fresh recording without Claude Code's debug cycle. → Mitigation: Acceptable — the `--record` path is intentionally simple. Complex debugging stays in Claude Code.
- **[Node version fragility]** Users with non-nvm Node setups may have trouble. → Mitigation: The plugin checks `demofly` version first; if it fails, provides clear instructions.
- **[ffmpeg dependency]** Assembly requires ffmpeg for stitching and conversion. → Mitigation: `generate` checks for ffmpeg and provides install guidance if missing. For audio-free cases, copy the webm directly if ffmpeg is unavailable.
