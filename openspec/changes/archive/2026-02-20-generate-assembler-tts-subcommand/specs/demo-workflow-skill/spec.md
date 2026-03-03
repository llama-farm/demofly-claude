## MODIFIED Requirements

### Requirement: Skill defines the demo generation pipeline

The `demo-workflow` skill SHALL describe the full demo generation pipeline that the agent follows: exploration, proposal, script, Playwright code generation, recording and verification, optional narration, and final assembly via CLI. The pipeline is guidance, not rigid — the agent adapts based on user input and existing artifacts.

The skill's script.md format section SHALL define the **beat-centric format** where each scene is composed of numbered beats. Each beat pairs a narration fragment with ordered actions via a Words/Action table, and carries a timing marker ID in its heading.

The skill's final assembly section SHALL describe the CLI integration: calling `demofly tts <name>` for TTS audio generation and `demofly generate <name>` for final video assembly. The skill SHALL document that TTS and assembly are deterministic CLI operations, not inline agent operations.

#### Scenario: Agent follows pipeline for new demo

- **WHEN** the demo-engineer agent starts a new demo with no existing artifacts
- **THEN** it follows the pipeline from exploration through recording, consulting the skill for artifact formats and techniques at each phase

#### Scenario: Skill documents beat format with complete example

- **WHEN** an agent reads the skill's script.md format section
- **THEN** it finds a complete multi-scene example using beats with Words/Action tables, including silent beats, static beats, and multi-action continuation rows

#### Scenario: Skill documents CLI-based final assembly

- **WHEN** an agent reads the skill's final assembly section
- **THEN** it finds instructions to call `demofly tts <name>` (if transcript exists) followed by `demofly generate <name>` as the last pipeline steps
- **AND** the skill notes that these are deterministic CLI commands, not inline agent operations

### Requirement: Skill defines the transcript and stitching workflow

The skill's transcript and stitching section SHALL describe the workflow where the agent generates `transcript.md` with TTS tags, then delegates TTS synthesis to the `demofly tts` CLI command and final assembly to `demofly generate`. The skill SHALL NOT document inline ffmpeg stitching commands for the agent to run directly — assembly is delegated to the CLI.

#### Scenario: Skill documents TTS delegation

- **WHEN** an agent reads the skill's stitching section
- **THEN** it finds instructions to generate `transcript.md` and then call `demofly tts <name>` rather than running TTS inline

#### Scenario: Skill documents assembly delegation

- **WHEN** an agent reads the skill's assembly section
- **THEN** it finds instructions to call `demofly generate <name>` rather than running ffmpeg commands directly
