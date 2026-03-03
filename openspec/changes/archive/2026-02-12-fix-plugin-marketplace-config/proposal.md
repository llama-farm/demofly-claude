## Why

The demofly marketplace config (`.claude-plugin/marketplace.json`) and plugin manifest (`plugins/demofly/.claude-plugin/plugin.json`) are missing required fields per the Claude Code plugin marketplace schema. This makes the plugin invalid for marketplace listing and distribution. The configs were scaffolded with minimal fields and need to be completed.

## What Changes

- Add `$schema`, `version`, and `owner` block to `marketplace.json`
- Add `version`, `category`, and `tags` to the plugin entry in `marketplace.json`
- Add `author`, `repository`, `license`, and `keywords` to `plugin.json`

## Capabilities

### New Capabilities
- `plugin-marketplace-config`: Correct and complete marketplace and plugin manifest configuration aligned to Claude Code plugin marketplace schema requirements

### Modified Capabilities

## Impact

- `.claude-plugin/marketplace.json` — top-level marketplace manifest
- `plugins/demofly/.claude-plugin/plugin.json` — plugin-level manifest
- No code changes, no API changes, no dependency changes — config metadata only
