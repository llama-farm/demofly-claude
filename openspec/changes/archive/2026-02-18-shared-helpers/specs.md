# Specs: Shared Demo Helpers Template

## Spec 1: `helpers.ts` exports correct functions

- `helpers.ts` exports `createMarker`, `moveTo`, and `injectCursor` as named exports
- No default export
- File imports `Page`, `Locator`, `BoundingBox` from `@playwright/test`

## Spec 2: `createMarker` returns a bound mark function

- `createMarker()` returns a function with signature `(scene: string, action: string, target?: string) => void`
- The returned function calls `console.log` with format `DEMOFLY|{scene}|{action}|{target}|{elapsed_ms}`
- Elapsed ms is measured from the time `createMarker()` was called, not from module load
- When `target` is omitted, the target field is empty string (not "undefined")

## Spec 3: `moveTo` calculates distance-based delay and updates cursor

- When `prevBox` is provided, delay is `Math.round(80 + distance * 1.8)` ms where distance is Euclidean between box origins
- When `prevBox` is null/undefined, no delay is applied
- Updates `#demofly-cursor` element's `left` and `top` to center of target element
- Returns the target element's bounding box, or `null` if element has no box

## Spec 4: `injectCursor` creates the fake cursor element

- Creates a div with `id="demofly-cursor"`
- Uses `position: fixed`, `z-index: 999999`, `pointer-events: none`
- Includes CSS transition for smooth movement: `left 0.15s ease-out, top 0.15s ease-out`
- Visual: 20px circle, red with white border, drop shadow

## Spec 5: SKILL.md references the template

- SKILL.md contains a new section about the shared helpers template
- Section references `plugins/demofly/templates/helpers.ts` as source of truth
- Section includes the copy command: `cp plugins/demofly/templates/helpers.ts demofly/<name>/helpers.ts`
- Section shows import usage: `import { createMarker, moveTo, injectCursor } from './helpers'`
- Existing sections 2 and 3 include notes pointing agents to the template file
