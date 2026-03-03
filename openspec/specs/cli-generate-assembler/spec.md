## Purpose

Defines the refactored `demofly generate` CLI command as an assembler-first tool that reads existing artifacts from disk and produces a final video.

## Requirements

### Requirement: Generate command assembles existing artifacts by default

The `demofly generate` command SHALL, by default (without `--record`), look for existing artifacts on disk rather than running Playwright. It SHALL require `demo.spec.ts` and `playwright.config.ts` to exist in the project directory. It SHALL look for `recordings/video.webm` and `recordings/timing.json` as recording artifacts.

#### Scenario: All artifacts present with audio

- **WHEN** the user runs `demofly generate myproject` and `demofly/myproject/` contains `demo.spec.ts`, `playwright.config.ts`, `recordings/video.webm`, `recordings/timing.json`, and `audio/scene-1.wav`
- **THEN** the command stitches audio onto video using ffmpeg and outputs `recordings/final.mp4`

#### Scenario: All artifacts present without audio

- **WHEN** the user runs `demofly generate myproject` and `demofly/myproject/` contains `recordings/video.webm` and `recordings/timing.json` but no `audio/` directory
- **THEN** the command converts the webm to mp4 and outputs `recordings/final.mp4` as a silent video

#### Scenario: Video missing in interactive mode

- **WHEN** the user runs `demofly generate myproject` without `--record` and `recordings/video.webm` does not exist and stdin is a TTY
- **THEN** the command prompts "No recording found. Record now? (y/n)"
- **AND** if the user answers yes, the command runs the Playwright test, extracts timing, and continues with assembly

#### Scenario: Video missing in non-interactive mode

- **WHEN** the user runs `demofly generate myproject` without `--record` and `recordings/video.webm` does not exist and stdin is not a TTY
- **THEN** the command exits with a non-zero exit code and prints a message suggesting `--record` flag

### Requirement: Generate command supports --record flag for explicit recording

The `demofly generate` command SHALL accept a `--record` flag that triggers Playwright test execution before assembly. When `--record` is set, the command SHALL run `npx playwright test` using the project's `demo.spec.ts` and `playwright.config.ts`, parse DEMOFLY timing markers from console output, write `recordings/timing.json`, and move the recorded video to `recordings/video.webm`.

#### Scenario: Record flag triggers Playwright

- **WHEN** the user runs `demofly generate myproject --record`
- **THEN** the command runs `npx playwright test demofly/myproject/demo.spec.ts --config demofly/myproject/playwright.config.ts`
- **AND** parses DEMOFLY markers from the test output into `recordings/timing.json`
- **AND** moves the video from `test-results/` to `recordings/video.webm`
- **AND** continues to the assembly step

#### Scenario: Recording fails

- **WHEN** the user runs `demofly generate myproject --record` and the Playwright test fails
- **THEN** the command exits with a non-zero exit code and prints the test error output

### Requirement: Generate command prints assembly summary

The `demofly generate` command SHALL print a summary after completion including the video path, timing path, final output path, whether audio was stitched, total duration, and scene count.

#### Scenario: Summary after successful assembly with audio

- **WHEN** `demofly generate myproject` completes successfully with audio stitching
- **THEN** the summary shows the video path, timing path, final path, `Stitched: yes`, total duration, and scene count

#### Scenario: Summary after silent video assembly

- **WHEN** `demofly generate myproject` completes successfully without audio
- **THEN** the summary shows `Stitched: no` and lists the final video path

### Requirement: Generate command provides migration guidance for removed --narrate flag

The `demofly generate` command SHALL NOT accept a `--narrate` flag. If a user passes `--narrate`, the command SHALL exit with a helpful error message directing them to use `demofly tts` instead.

#### Scenario: User passes removed --narrate flag

- **WHEN** the user runs `demofly generate myproject --narrate`
- **THEN** the command exits with a message: "The --narrate flag has been removed. Run `demofly tts myproject` first, then `demofly generate myproject`."

### Requirement: Generate command requires ffmpeg for assembly

The `demofly generate` command SHALL check for ffmpeg availability before attempting assembly. If ffmpeg is not installed and audio stitching is needed, the command SHALL exit with an error and install guidance. If ffmpeg is not installed but no audio exists, the command SHALL copy the webm file directly as the output.

#### Scenario: ffmpeg missing with audio files

- **WHEN** `demofly generate myproject` runs and audio files exist but ffmpeg is not installed
- **THEN** the command exits with an error message suggesting how to install ffmpeg

#### Scenario: ffmpeg missing without audio files

- **WHEN** `demofly generate myproject` runs and no audio files exist and ffmpeg is not installed
- **THEN** the command copies `recordings/video.webm` to `recordings/final.webm` and notes that mp4 conversion requires ffmpeg
