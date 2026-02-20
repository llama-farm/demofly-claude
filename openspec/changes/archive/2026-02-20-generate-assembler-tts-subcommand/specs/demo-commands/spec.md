## MODIFIED Requirements

### Requirement: Create command starts or continues a demo

The plugin SHALL provide a `/demofly:create` command that accepts an optional demo name argument. When invoked, it SHALL:
1. Check for Playwright MCP availability. If not found, inform the user how to install it and stop.
2. If no name is provided, ask the user for a demo name.
3. If the demo directory (`demofly/<name>/`) does not exist, start a new demo from the beginning.
4. If the demo directory exists, infer the current phase from which files are present and continue from the next incomplete phase.
5. Walk the user through the pipeline: exploration, proposal (with user approval), script, Playwright generation, recording, and optional narration.
6. After recording and optional narration transcript generation, call `demofly tts <name>` (if transcript was generated) and `demofly generate <name>` to produce the final assembled video.

#### Scenario: New demo with name argument

- **WHEN** the user runs `/demofly:create product-tour` and `demofly/product-tour/` does not exist
- **THEN** the agent begins the exploration phase and creates `demofly/product-tour/`

#### Scenario: Resume incomplete demo

- **WHEN** the user runs `/demofly:create product-tour` and `demofly/product-tour/proposal.md` exists but `demo.spec.ts` does not
- **THEN** the agent reads the existing proposal and continues from script generation

#### Scenario: Playwright MCP not available

- **WHEN** the user runs `/demofly:create` and Playwright MCP tools are not available
- **THEN** the agent informs the user that Playwright MCP is required and provides installation guidance without proceeding further

#### Scenario: No name provided

- **WHEN** the user runs `/demofly:create` without a name argument
- **THEN** the agent asks the user what they want to name this demo

#### Scenario: Full pipeline completion with narration

- **WHEN** the agent completes recording and the user requests narration
- **THEN** the agent generates `transcript.md`, runs `demofly tts <name>` to produce audio files, and runs `demofly generate <name>` to assemble the final video
- **AND** reports the final video location to the user

#### Scenario: Full pipeline completion without narration

- **WHEN** the agent completes recording and the user declines narration
- **THEN** the agent runs `demofly generate <name>` to produce the final video (silent, no audio stitching)
- **AND** reports the final video location to the user

#### Scenario: demofly CLI not available

- **WHEN** the agent attempts to run `demofly tts` or `demofly generate` and the demofly CLI is not found or returns a Node.js version error
- **THEN** the agent informs the user that the demofly CLI requires Node 22+ and provides guidance on installation or version switching

#### Scenario: demofly generate fails

- **WHEN** the agent runs `demofly generate <name>` and it exits with a non-zero exit code
- **THEN** the agent reports the error to the user and suggests manual troubleshooting
