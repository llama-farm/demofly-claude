## Purpose

Defines the plugin directory structure and manifest files for the Demofly Claude Code plugin.

## Requirements

### Requirement: Marketplace manifest exists at repo root

The repo SHALL have a `.claude-plugin/marketplace.json` file at the root that lists `demofly` as an available plugin with its name, description, and source path pointing to the plugin directory.

#### Scenario: User adds this repo as a marketplace

- **WHEN** a user runs `/plugin marketplace add <this-repo-url>`
- **THEN** the `demofly` plugin appears in their Discover tab with its name and description

### Requirement: Plugin manifest with required metadata

The plugin directory (`plugins/demofly/`) SHALL contain a `.claude-plugin/plugin.json` with at minimum: `name` ("demofly"), `description`, and `version` (starting at "0.1.0").

#### Scenario: Plugin loads without errors

- **WHEN** a user installs the demofly plugin from the marketplace
- **THEN** the plugin loads successfully with no errors in the Errors tab

### Requirement: Plugin directory structure follows conventions

The plugin SHALL organize components in the standard Claude Code plugin layout:
- `commands/` for slash commands
- `agents/` for agent definitions
- `skills/` for skill definitions

All component directories SHALL be at the plugin root level, not inside `.claude-plugin/`.

#### Scenario: All components are discovered

- **WHEN** the plugin is installed and a session starts
- **THEN** Claude has access to the plugin's commands, agents, and skills
