# Tasks: Shared Demo Helpers Template

## Task 1: Create `plugins/demofly/templates/helpers.ts`

- [x] Create `plugins/demofly/templates/` directory
- [x] Create `helpers.ts` with imports from `@playwright/test`
- [x] Implement `createMarker()` factory function
- [x] Implement `moveTo()` with distance-based delay and cursor update
- [x] Implement `injectCursor()` with fake DOM cursor injection
- [x] All three functions exported as named exports, no default export

## Task 2: Update SKILL.md with helpers template section

- [x] Add section "8. Shared Helpers Template" after section 7 in `plugins/demofly/skills/demo-workflow/SKILL.md`
- [x] Include template file path reference (`plugins/demofly/templates/helpers.ts`)
- [x] Include copy command: `cp plugins/demofly/templates/helpers.ts demofly/<name>/helpers.ts`
- [x] Include import usage example with `createMarker`, `moveTo`, `injectCursor`
- [x] Include note that `injectCursor` must be re-called after full-page navigation
- [x] Include complete demo.spec.ts usage example showing the full pattern

## Task 3: Add cross-references in existing SKILL.md sections

- [x] In section 2 (Timing Marker System), add a note after the inline `mark` definition pointing to the template as preferred approach
- [x] In section 3 (Human-Like Interaction Patterns), add a note after `moveTo` and `injectCursor` definitions pointing to the template
