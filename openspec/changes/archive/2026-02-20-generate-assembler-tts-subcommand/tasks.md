## 1. Extract `demofly tts` subcommand (CLI repo)

- [x] 1.1 Create `packages/cli/src/commands/tts.ts` with `registerTtsCommand()` that accepts `<project>`, `--voice`, and `--speed` options
- [x] 1.2 Wire up `registerTtsCommand` in `packages/cli/src/index.ts`
- [x] 1.3 Implement the tts command: validate transcript.md exists, create audio directory, call `generateAllAudio()` from existing `lib/tts.ts`, print per-scene progress and summary
- [x] 1.4 Handle error cases: missing transcript (exit with message), missing Kokoro model (exit with `demofly init` hint), invalid voice name (exit with available voices list)

## 2. Refactor `demofly generate` to assembler-first (CLI repo)

- [x] 2.1 Add `--record` flag to the generate command options
- [x] 2.2 Extract the existing Playwright recording logic (runPlaywrightTest, parseTimingMarkers, findRecordedVideo, video move) into a `recordDemo()` helper function
- [x] 2.3 Implement artifact discovery: check for `recordings/video.webm` and `recordings/timing.json` on disk
- [x] 2.4 Implement interactive prompting: when video is missing and no `--record`, check `process.stdin.isTTY` — if TTY, prompt "No recording found. Record now?"; if not TTY, exit with error and `--record` hint
- [x] 2.5 Wire up the flow: if `--record` or user confirms prompt → call `recordDemo()`; otherwise use existing artifacts
- [x] 2.6 Remove `--narrate` flag and TTS logic from generate. Add check: if user passes `--narrate`, exit with migration message pointing to `demofly tts`
- [x] 2.7 Keep existing assembly logic (findAudioFiles, buildFfmpegCommand, stitchAudio, printSummary) — these already work with artifacts on disk
- [x] 2.8 Add ffmpeg availability check: if audio exists but ffmpeg is missing, exit with install guidance; if no audio and no ffmpeg, copy webm as-is

## 3. Update Claude Code plugin — create command (this repo)

- [x] 3.1 Add a new Step 9 ("Final Assembly") to `plugins/demofly/commands/create.md` after the existing Step 8 (Narration)
- [x] 3.2 Step 9 logic: if transcript.md was generated, run `demofly tts <name>` via Bash; then run `demofly generate <name>` via Bash
- [x] 3.3 Add Node.js version handling: attempt `demofly` directly first; if it fails with a version error, retry with nvm (`source ~/.nvm/nvm.sh && nvm use 22 && demofly ...`)
- [x] 3.4 Add error handling: if `demofly tts` fails, report to user and continue to `demofly generate` (video without audio is still useful); if `demofly generate` fails, report error and suggest manual troubleshooting
- [x] 3.5 Add demofly CLI availability check: if `demofly` command not found, inform user to install it and provide guidance
- [x] 3.6 Update the phase detection table in Step 2 to account for `recordings/final.mp4` as a completion indicator

## 4. Update Claude Code plugin — demo-workflow skill (this repo)

- [x] 4.1 Update Section 7 (Transcript and Stitching) of `plugins/demofly/skills/demo-workflow/SKILL.md` to replace inline ffmpeg stitching instructions with `demofly tts` + `demofly generate` delegation
- [x] 4.2 Update Section 1 (Artifact Pipeline Overview) to show the CLI commands as the final pipeline steps
- [x] 4.3 Remove or simplify the ffmpeg stitching code examples and the dynamic ffmpeg command construction — these now live in the CLI, not in agent instructions

## 5. Update agent description (this repo)

- [x] 5.1 Update `plugins/demofly/agents/demo-engineer.md` Phase 6 (Post-Process) and Phase 7 (Narration) to reference the CLI commands instead of inline ffmpeg/TTS operations
