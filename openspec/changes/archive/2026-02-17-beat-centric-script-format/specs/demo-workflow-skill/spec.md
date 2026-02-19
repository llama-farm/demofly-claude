## MODIFIED Requirements

### Requirement: Skill defines the demo generation pipeline

The `demo-workflow` skill SHALL describe the full demo generation pipeline that the agent follows: exploration, proposal, script, Playwright code generation, recording and verification, and optional narration. The pipeline is guidance, not rigid — the agent adapts based on user input and existing artifacts.

The skill's script.md format section SHALL define the **beat-centric format** where each scene is composed of numbered beats. Each beat pairs a narration fragment with ordered actions via a Words/Action table, and carries a timing marker ID in its heading.

The skill's transcript and stitching section SHALL describe **per-beat audio generation and stitching**, where each beat produces one TTS audio clip positioned at its marker timestamp.

#### Scenario: Agent follows pipeline for new demo

- **WHEN** the demo-engineer agent starts a new demo with no existing artifacts
- **THEN** it follows the pipeline from exploration through recording, consulting the skill for artifact formats and techniques at each phase

#### Scenario: Skill documents beat format with complete example

- **WHEN** an agent reads the skill's script.md format section
- **THEN** it finds a complete multi-scene example using beats with Words/Action tables, including silent beats, static beats, and multi-action continuation rows

#### Scenario: Skill documents per-beat stitching

- **WHEN** an agent reads the skill's stitching section
- **THEN** it finds instructions for constructing ffmpeg commands with one audio input per beat, using marker timestamps for adelay values
