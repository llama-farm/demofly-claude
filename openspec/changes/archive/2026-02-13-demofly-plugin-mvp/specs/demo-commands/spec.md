## ADDED Requirements

### Requirement: Create command starts or continues a demo

The plugin SHALL provide a `/demofly:create` command that accepts an optional demo name argument. When invoked, it SHALL:
1. Check for Playwright MCP availability. If not found, inform the user how to install it and stop.
2. If no name is provided, ask the user for a demo name.
3. If the demo directory (`demofly/<name>/`) does not exist, start a new demo from the beginning.
4. If the demo directory exists, infer the current phase from which files are present and continue from the next incomplete phase.
5. Walk the user through the pipeline: exploration, proposal (with user approval), script, Playwright generation, recording, and optional narration.

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

### Requirement: List command shows all demos

The plugin SHALL provide a `/demofly:list` command that scans the `demofly/` directory and displays each demo subdirectory with its current phase (inferred from file existence).

#### Scenario: Multiple demos exist

- **WHEN** the user runs `/demofly:list` and `demofly/` contains `product-tour/` (with all files) and `feature-demo/` (with only `proposal.md`)
- **THEN** the output shows `product-tour` as recorded/complete and `feature-demo` as proposed

#### Scenario: No demos exist

- **WHEN** the user runs `/demofly:list` and `demofly/` does not exist or is empty
- **THEN** the output indicates no demos have been created and suggests `/demofly:create`
