## Purpose

Defines the `demofly tts` CLI subcommand that generates TTS audio from a transcript file.

## ADDED Requirements

### Requirement: TTS subcommand generates audio from transcript

The `demofly tts` command SHALL accept a project name argument and generate WAV audio files from the project's `transcript.md`. It SHALL read `demofly/<project>/transcript.md`, parse it into per-scene narration text, synthesize audio using Kokoro TTS via sherpa-onnx-node, and write output files to `demofly/<project>/audio/<scene-id>.wav`.

#### Scenario: Successful TTS generation

- **WHEN** the user runs `demofly tts myproject` and `demofly/myproject/transcript.md` exists with valid narration content
- **THEN** the command generates one WAV file per scene in `demofly/myproject/audio/` named by scene ID (e.g., `scene-1.wav`, `scene-2.wav`)
- **AND** prints per-scene progress including character count, audio duration, and elapsed time

#### Scenario: Transcript file missing

- **WHEN** the user runs `demofly tts myproject` and `demofly/myproject/transcript.md` does not exist
- **THEN** the command exits with a non-zero exit code and prints an error message indicating the transcript is missing

#### Scenario: Kokoro model not installed

- **WHEN** the user runs `demofly tts myproject` and the Kokoro model files are not found at the expected location
- **THEN** the command exits with a non-zero exit code and prints an error suggesting `demofly init` to download the model

### Requirement: TTS subcommand supports voice and speed options

The `demofly tts` command SHALL accept `--voice <name>` and `--speed <multiplier>` options to control the TTS output. The default voice SHALL be `af_heart` and the default speed SHALL be `1.0`.

#### Scenario: Custom voice selection

- **WHEN** the user runs `demofly tts myproject --voice am_adam`
- **THEN** the command generates audio using the `am_adam` voice

#### Scenario: Invalid voice name

- **WHEN** the user runs `demofly tts myproject --voice nonexistent`
- **THEN** the command exits with a non-zero exit code and prints the list of available voice names

#### Scenario: Speed adjustment

- **WHEN** the user runs `demofly tts myproject --speed 1.2`
- **THEN** the command generates audio at 1.2x speed

### Requirement: TTS subcommand creates audio directory

The `demofly tts` command SHALL create the `demofly/<project>/audio/` directory if it does not exist. If audio files already exist, they SHALL be overwritten.

#### Scenario: Audio directory does not exist

- **WHEN** the user runs `demofly tts myproject` and `demofly/myproject/audio/` does not exist
- **THEN** the command creates the directory and writes audio files into it

#### Scenario: Audio files already exist

- **WHEN** the user runs `demofly tts myproject` and `demofly/myproject/audio/scene-1.wav` already exists
- **THEN** the existing file is overwritten with newly generated audio
