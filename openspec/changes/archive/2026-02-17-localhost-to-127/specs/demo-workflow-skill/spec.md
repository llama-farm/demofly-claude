## MODIFIED Requirements

### Requirement: Skill defines Playwright recording configuration

The skill SHALL instruct the agent to create a `playwright.config.ts` with video recording enabled, a 1280x800 viewport as default, and appropriate test timeout settings for long-running demo recordings (up to 10 minutes). The config template SHALL use `127.0.0.1` instead of `localhost` for the baseURL to avoid DNS resolution issues in headless Chromium environments.

#### Scenario: Recording config enables video capture

- **WHEN** the agent generates playwright.config.ts
- **THEN** the config includes video recording settings with `video: 'on'` and a viewport of 1280x800

#### Scenario: Recording config uses IP literal for baseURL

- **WHEN** the agent generates playwright.config.ts from the skill template
- **THEN** the baseURL uses `127.0.0.1` instead of `localhost`
- **AND** an inline comment explains that IP literals avoid DNS resolution issues in headless browsers
