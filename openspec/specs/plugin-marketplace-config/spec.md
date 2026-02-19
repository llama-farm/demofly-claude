## Purpose

Defines the Claude Code plugin marketplace configuration and manifest requirements.

## Requirements

### Requirement: Marketplace manifest has schema reference
The `.claude-plugin/marketplace.json` file SHALL include a `$schema` field set to `"https://anthropic.com/claude-code/marketplace.schema.json"`.

#### Scenario: Schema reference present
- **WHEN** reading `.claude-plugin/marketplace.json`
- **THEN** the file SHALL contain `"$schema": "https://anthropic.com/claude-code/marketplace.schema.json"`

### Requirement: Marketplace manifest has version
The `.claude-plugin/marketplace.json` file SHALL include a `version` field with a valid semver string.

#### Scenario: Version field present
- **WHEN** reading `.claude-plugin/marketplace.json`
- **THEN** the file SHALL contain a `"version"` field with a semver value (e.g., `"1.0.0"`)

### Requirement: Marketplace manifest has owner block
The `.claude-plugin/marketplace.json` file SHALL include an `owner` object with `name` and `url` fields.

#### Scenario: Owner block present
- **WHEN** reading `.claude-plugin/marketplace.json`
- **THEN** the file SHALL contain an `"owner"` object with non-empty `"name"` and `"url"` string fields

### Requirement: Marketplace plugin entry has version
Each plugin entry in the `plugins` array SHALL include a `version` field matching the plugin's own `plugin.json` version.

#### Scenario: Plugin entry version present and matches
- **WHEN** reading the demofly entry in `marketplace.json` `plugins` array
- **THEN** it SHALL contain a `"version"` field matching `plugins/demofly/.claude-plugin/plugin.json` version

### Requirement: Marketplace plugin entry has category
Each plugin entry in the `plugins` array SHALL include a `category` field with a valid category string.

#### Scenario: Plugin entry has category
- **WHEN** reading the demofly entry in `marketplace.json` `plugins` array
- **THEN** it SHALL contain a `"category"` field (e.g., `"development"`)

### Requirement: Marketplace plugin entry has tags
Each plugin entry in the `plugins` array SHALL include a `tags` array with at least one string for discoverability.

#### Scenario: Plugin entry has tags array
- **WHEN** reading the demofly entry in `marketplace.json` `plugins` array
- **THEN** it SHALL contain a `"tags"` array with at least one non-empty string

### Requirement: Plugin manifest has author block
The `plugins/demofly/.claude-plugin/plugin.json` file SHALL include an `author` object with `name` and `url` fields.

#### Scenario: Author block present
- **WHEN** reading `plugins/demofly/.claude-plugin/plugin.json`
- **THEN** the file SHALL contain an `"author"` object with non-empty `"name"` and `"url"` string fields

### Requirement: Plugin manifest has repository
The `plugins/demofly/.claude-plugin/plugin.json` file SHALL include a `repository` field with a valid URL string.

#### Scenario: Repository URL present
- **WHEN** reading `plugins/demofly/.claude-plugin/plugin.json`
- **THEN** the file SHALL contain a `"repository"` field with a non-empty URL string

### Requirement: Plugin manifest has license
The `plugins/demofly/.claude-plugin/plugin.json` file SHALL include a `license` field with a valid SPDX license identifier.

#### Scenario: License field present
- **WHEN** reading `plugins/demofly/.claude-plugin/plugin.json`
- **THEN** the file SHALL contain a `"license"` field with a valid SPDX identifier (e.g., `"MIT"`)

### Requirement: Plugin manifest has keywords
The `plugins/demofly/.claude-plugin/plugin.json` file SHALL include a `keywords` array with at least one string for discoverability.

#### Scenario: Keywords array present
- **WHEN** reading `plugins/demofly/.claude-plugin/plugin.json`
- **THEN** the file SHALL contain a `"keywords"` array with at least one non-empty string
