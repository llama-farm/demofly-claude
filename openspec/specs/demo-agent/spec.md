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
