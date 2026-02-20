## Why

The `demofly generate` CLI command currently duplicates work that the Claude Code plugin already does — running Playwright tests, parsing timing markers, extracting video, and writing timing.json. Meanwhile, the plugin's `/demofly:create` command ends without calling the CLI at all, missing the CLI's unique capabilities (Kokoro TTS and audio-video stitching). This creates two parallel pipelines that share no artifacts and maintain duplicate logic.

Restructuring `generate` as an assembler-first command (that reads existing artifacts from disk) and extracting `demofly tts` as a standalone subcommand creates a clean separation: Claude Code owns creative/adaptive work (exploration, scripting, recording, debugging), the CLI owns deterministic transformations (TTS synthesis, audio-video assembly), and the `demofly/<name>/` directory is the shared contract between them.

## What Changes

- **Refactor `demofly generate`** from an orchestrator (that runs Playwright + everything) to an assembler that reads existing artifacts (`recordings/video.webm`, `recordings/timing.json`, `audio/*.wav`) and produces `recordings/final.mp4`. By default it looks for artifacts on disk; if the video is missing, it prompts interactively (or errors in non-interactive mode). A `--record` flag explicitly triggers Playwright recording before assembly.
- **Extract `demofly tts`** as a standalone subcommand that generates audio from `transcript.md` into `audio/*.wav`. This isolates the Kokoro/sherpa-onnx-node TTS capability as a focused utility.
- **Remove `--narrate` from `demofly generate`**. TTS is now a separate step via `demofly tts`. **BREAKING**: Users who relied on `demofly generate --narrate` must now run `demofly tts` first.
- **Update `/demofly:create`** to call `demofly tts <name>` (if narration requested) and `demofly generate <name>` as the final steps after recording, closing the loop from Claude Code through to final video output.
- **Update the `demo-workflow` skill** to document the new CLI integration and the artifact-based contract between Claude Code and the CLI.

## Capabilities

### New Capabilities

- `cli-tts-subcommand`: Defines the `demofly tts` CLI subcommand — input/output contract, transcript parsing, audio output format, voice/speed options.
- `cli-generate-assembler`: Defines the refactored `demofly generate` command — assembler-first behavior, `--record` flag, artifact discovery, interactive prompting, ffmpeg stitching logic.

### Modified Capabilities

- `demo-commands`: The `/demofly:create` command gains a final "assembly" step that calls `demofly tts` and `demofly generate` after recording completes.
- `demo-workflow-skill`: The skill's pipeline documentation and stitching section must reflect that TTS and final assembly are now CLI commands called by the agent, not inline operations.

## Impact

- **CLI (`demofly` repo, `packages/cli/`)**: `commands/generate.ts` refactored, new `commands/tts.ts`, `lib/tts.ts` stays but is called from new subcommand.
- **Plugin (`plugins/demofly/`)**: `commands/create.md` updated with new Step 9 (TTS + assembly), `skills/demo-workflow/SKILL.md` sections 7-8 updated.
- **Breaking change**: `demofly generate --narrate` removed. Users must run `demofly tts` separately before `demofly generate`.
- **Node.js version**: Commands calling `demofly` from Claude Code must ensure Node 22+ (via nvm or similar).
