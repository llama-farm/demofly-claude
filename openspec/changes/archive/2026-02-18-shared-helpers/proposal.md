# Proposal: Extract Shared Demo Helpers Template

## Problem

Every `demo.spec.ts` file inlines the same helper functions: `moveTo` (distance-based cursor movement), `injectCursor` (fake DOM cursor), and the timing marker (`t0`/`mark`). This leads to duplication across demos and inconsistency when patterns evolve.

## Solution

Create a **template file** at `plugins/demofly/templates/helpers.ts` that agents copy into each new demo project directory. This is a stamp/copy pattern, not a shared import — because demo specs run from arbitrary project directories and cannot import from the plugin directory.

## What Changes

### New File: `plugins/demofly/templates/helpers.ts`

Exports:

1. **`createMarker()`** — Factory function that captures `Date.now()` at call time and returns a bound `mark(scene, action, target?)` function. Each spec gets its own `t0` by calling `createMarker()` once at the top.

2. **`moveTo(page, element, prevBox?)`** — Calculates pixel distance from previous bounding box, waits proportionally (80ms base + 1.8ms/px), then updates the fake cursor position. Returns the new bounding box.

3. **`injectCursor(page)`** — Injects the fake DOM cursor div (`#demofly-cursor`) with fixed positioning, transitions, and high z-index. Must be called after each full-page navigation.

### Modified File: `plugins/demofly/skills/demo-workflow/SKILL.md`

- Add a new section referencing the template file
- Instruct agents to copy `helpers.ts` into the demo directory and import from it
- Update existing code examples to show import-based usage instead of inline definitions

## Copy Mechanism

Agents literally copy the file: `cp plugins/demofly/templates/helpers.ts demofly/<name>/helpers.ts`. No customization needed — constants like `moveTo`'s 80ms base and 1.8ms/px are intentionally fixed to maintain consistency across demos. If a demo needs different timing, the agent modifies the copy.

## Considered and Deferred

- **`typeText` helper** (wrapping `pressSequentially` + read-time pause): Good candidate but less mechanical than the three extracted helpers. Typing delay and read-time formulas vary more per-demo. Defer to a follow-up.
- **`smoothScroll` helper**: Similarly, scroll distance and wait times vary. Defer.

## Non-Goals

- No npm package or shared library import across directories
- No changes to the marker protocol format (`DEMOFLY|scene|action|target|ms`)
- No changes to existing demo recordings or specs (they keep working as-is)

## Risks

- Agents must remember to copy the template file. Mitigated by clear SKILL.md instructions.
- Template may drift from SKILL.md examples if updated independently. Mitigated by having SKILL.md reference the template as source of truth.
