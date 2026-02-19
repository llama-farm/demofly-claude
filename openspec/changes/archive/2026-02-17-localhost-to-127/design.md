## Context

The demo-workflow SKILL.md is the single source of truth for how demo-engineer agents generate Playwright-based demo recordings. Section 4 contains a `playwright.config.ts` template with `baseURL: 'http://localhost:3000'`. This template is copied verbatim by agents into every new demo directory.

Headless Chromium (used by Playwright) resolves `localhost` via the system's DNS/hosts configuration, which can differ from expectations — particularly on minimal Linux installs, containers, CI environments, and sandboxed agent runtimes where `localhost` may resolve to IPv6 `::1` while the dev server only binds `0.0.0.0` (IPv4).

## Goals / Non-Goals

**Goals:**
- Eliminate localhost DNS resolution as a source of recording failures
- Document the rationale so agents and developers understand why

**Non-Goals:**
- Changing how Playwright or Chromium resolves hostnames (upstream issue)
- Modifying any existing demo specs or configs (this is a template change only)
- Supporting non-loopback addresses

## Decisions

**Use `127.0.0.1` as the default baseURL in templates.**
- Rationale: IP literals bypass DNS resolution entirely. `127.0.0.1` always means IPv4 loopback — no ambiguity.
- Alternative considered: `localhost` with a note to switch if broken. Rejected because the note would be ignored and the failure is confusing (Chromium shows a generic connection refused error with no hint about DNS).
- Alternative considered: `[::1]` (IPv6 loopback). Rejected because most dev servers default to IPv4 binding.

**Add an inline comment in the config template explaining the choice.**
- One line is enough. Agents and developers scan templates quickly.

## Risks / Trade-offs

- [Risk] Dev servers bound to `localhost` only (not `0.0.0.0` or `127.0.0.1`) won't accept connections to `127.0.0.1` → Mitigation: This is rare; most frameworks bind to all interfaces or `localhost` which includes `127.0.0.1`. Add a note about this edge case.
- [Trade-off] `127.0.0.1` is slightly less readable than `localhost` → Acceptable; correctness over aesthetics.
