## Context

The demofly plugin was scaffolded with minimal marketplace and plugin manifest configs. Both JSON files exist but are missing required fields per the Claude Code plugin marketplace schema. This is a metadata-only fix — no code, architecture, or logic changes.

Current files:
- `.claude-plugin/marketplace.json` — has name, description, and a single plugin entry (name, description, source)
- `plugins/demofly/.claude-plugin/plugin.json` — has name, description, version

## Goals / Non-Goals

**Goals:**
- Make `marketplace.json` valid per the marketplace schema (add `$schema`, `version`, `owner`, and plugin-entry `version`/`category`/`tags`)
- Make `plugin.json` complete with `author`, `repository`, `license`, and `keywords`
- Align both files so metadata is consistent (e.g., version matches between marketplace plugin entry and plugin.json)

**Non-Goals:**
- Changing plugin functionality or capabilities
- Adding new plugins to the marketplace config
- Setting up CI validation of these schemas

## Decisions

1. **Marketplace schema version**: Use `"version": "1.0.0"` for the marketplace config version (schema version, not plugin version).
2. **Plugin category**: Use `"development"` — demofly is a developer tool for generating demo videos of web apps.
3. **License**: Use `"MIT"` — standard permissive open-source license, consistent with the llama-farm ecosystem.
4. **Owner/Author alignment**: Use consistent name/url across both `owner` (marketplace) and `author` (plugin) blocks.
5. **Tags/Keywords strategy**: Tags (marketplace) focus on discoverability in the marketplace. Keywords (plugin) describe the plugin's technical domain. Some overlap is expected and fine.

## Risks / Trade-offs

- [Owner/repo URL not yet confirmed] → Use placeholder values that the user can update. Mark with TODO comments if needed.
- [Schema URL may not be live yet] → Include it anyway per the documented requirement; it's a forward-compatible reference.
