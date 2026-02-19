## Why

Headless Chromium can resolve `localhost` differently than expected on some systems (e.g., resolving to IPv6 `::1` while the dev server only binds IPv4, or DNS resolution failing entirely in sandboxed environments). The SKILL.md config template currently uses `http://localhost:3000` as the default baseURL, causing connection failures that are confusing to debug. Switching to `127.0.0.1` eliminates this class of issue.

## What Changes

- Replace all `http://localhost:3000` references in the demo-workflow SKILL.md config templates and examples with `http://127.0.0.1:3000`
- Add a brief explanatory note about why `127.0.0.1` is preferred over `localhost` for headless browser testing

## Capabilities

### New Capabilities

_(none — this is a documentation fix)_

### Modified Capabilities

- `demo-workflow-skill`: The skill's Playwright configuration template changes its default baseURL from `localhost` to `127.0.0.1`, and adds guidance about localhost resolution in headless environments.

## Impact

- **Affected files:** `plugins/demofly/skills/demo-workflow/SKILL.md` (Section 4: Playwright Recording Configuration, and any other baseURL references)
- **No code changes** — documentation/template only
- **No breaking changes** — existing demos using localhost will still work; this changes the recommended default
