## Purpose

Defines the demo-engineer agent that orchestrates automated demo video generation.

## Requirements

### Requirement: Demo engineer agent orchestrates the workflow

The plugin SHALL define a `demo-engineer` agent that serves as the primary orchestrator for demo generation. The agent SHALL have access to all standard Claude Code tools including Read, Write, Edit, Bash, Glob, Grep, and Playwright MCP tools.

#### Scenario: Agent is available for spawning

- **WHEN** the plugin is installed and Claude needs to perform demo generation work
- **THEN** the demo-engineer agent is available as a sub-agent type via the Task tool

### Requirement: Agent delegates exploration to parallel sub-agents

During the exploration phase, the agent SHALL launch codebase exploration and UI exploration as parallel sub-agents. Codebase exploration SHALL use the built-in `Explore` sub-agent type. UI exploration SHALL use the built-in `general-purpose` sub-agent type with Playwright MCP access.

#### Scenario: Parallel exploration for new demo

- **WHEN** the agent begins exploration for a demo and no `demofly/context.md` exists
- **THEN** it launches both an Explore agent (for codebase analysis) and a general-purpose agent (for Playwright-based UI browsing) concurrently, and synthesizes their results into `demofly/context.md`

#### Scenario: Exploration with existing context

- **WHEN** the agent begins exploration and `demofly/context.md` already exists
- **THEN** it reads the existing context, does a quick check of the running app via Playwright MCP, and updates context.md only if things have changed

### Requirement: Agent delegates debugging to sub-agents

When the Playwright test script fails during verification, the agent SHALL delegate failure diagnosis to a general-purpose sub-agent, passing it the error output and relevant code. The sub-agent returns a diagnosis and specific fixes. The parent agent applies the fixes and re-runs.

#### Scenario: Playwright test failure

- **WHEN** the Playwright recording script fails during execution
- **THEN** the agent spawns a general-purpose sub-agent with the error output and relevant demo.spec.ts code, receives fix recommendations, applies them, and re-runs the test

### Requirement: Agent keeps parent context lean

The agent SHALL delegate all high-volume exploration and debugging work to sub-agents. The parent context SHALL contain only user messages, sub-agent result summaries, artifact read/write operations, and orchestration decisions.

#### Scenario: Context after full demo generation

- **WHEN** a complete demo has been generated from scratch
- **THEN** the parent context contains sub-agent result summaries rather than raw file reads, Playwright snapshots, or verbose error logs

### Requirement: Agent reconciles timing.json via LLM before TTS

After extracting timing.json and before TTS/transcript generation, the agent SHALL
perform an LLM-based reconciliation step. The agent reads the generated timing.json,
prompts Claude with the exact TimingData interface and the generated content, and
asks it to normalize the JSON to match the interface. The corrected output is written
back. This handles arbitrary field naming variations, not just known snake_case patterns.

#### Scenario: timing.json has correct field names

- **WHEN** the agent generates timing.json with correct camelCase fields
- **THEN** the LLM reconciliation step confirms the schema is correct and writes back an identical file

#### Scenario: timing.json has unexpected field names

- **WHEN** the agent generates timing.json with non-standard field names (e.g. `duration`, `begin`, `finish`, or any other variation)
- **THEN** the LLM reconciliation step normalizes all fields to match the TimingData interface and writes the corrected JSON back
