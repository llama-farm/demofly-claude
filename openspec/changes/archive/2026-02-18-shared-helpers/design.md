# Design: Shared Demo Helpers Template

## File: `plugins/demofly/templates/helpers.ts`

### Imports

```typescript
import { Page, Locator, BoundingBox } from '@playwright/test';
```

### `createMarker(): (scene: string, action: string, target?: string) => void`

Factory that captures `Date.now()` and returns a bound `mark` function.

```typescript
export function createMarker(): (scene: string, action: string, target?: string) => void {
  const t0 = Date.now();
  return (scene: string, action: string, target?: string) =>
    console.log(`DEMOFLY|${scene}|${action}|${target ?? ''}|${Date.now() - t0}`);
}
```

### `moveTo(page, element, prevBox?): Promise<BoundingBox | null>`

Calculates pixel distance, waits proportionally, updates fake cursor position.

```typescript
export async function moveTo(
  page: Page,
  element: Locator,
  prevBox?: BoundingBox | null
): Promise<BoundingBox | null> {
  const box = await element.boundingBox();
  if (!box) return null;

  if (prevBox) {
    const distance = Math.sqrt(
      Math.pow(box.x - prevBox.x, 2) + Math.pow(box.y - prevBox.y, 2)
    );
    await page.waitForTimeout(Math.round(80 + distance * 1.8));
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById('demofly-cursor');
      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      }
    },
    { x: centerX, y: centerY }
  );

  return box;
}
```

### `injectCursor(page): Promise<void>`

Injects `#demofly-cursor` div. Must be called after each full-page navigation.

```typescript
export async function injectCursor(page: Page): Promise<void> {
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demofly-cursor';
    cursor.style.cssText = `
      width: 20px;
      height: 20px;
      background: rgba(255, 50, 50, 0.9);
      border: 2px solid white;
      border-radius: 50%;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999999;
      pointer-events: none;
      transition: left 0.15s ease-out, top 0.15s ease-out;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(cursor);
  });
}
```

## SKILL.md Changes

Add a new section **"8. Shared Helpers Template"** after section 7, containing:

1. Reference to `plugins/demofly/templates/helpers.ts` as source of truth
2. Copy instruction: `cp plugins/demofly/templates/helpers.ts demofly/<name>/helpers.ts`
3. Import usage example:
   ```typescript
   import { createMarker, moveTo, injectCursor } from './helpers';
   const mark = createMarker();
   ```
4. Note that `injectCursor` must be re-called after full-page navigation
5. Update the inline examples in sections 2 and 3 to add notes pointing to the template

## Usage Example (in demo.spec.ts)

```typescript
import { test } from '@playwright/test';
import { createMarker, moveTo, injectCursor } from './helpers';

test('demo recording', async ({ page }) => {
  const mark = createMarker();
  
  await page.goto('http://127.0.0.1:3000');
  await injectCursor(page);
  
  let prevBox = null;
  
  mark('scene-1', 'start');
  
  const btn = page.getByRole('button', { name: 'New Project' });
  prevBox = await moveTo(page, btn, prevBox);
  mark('scene-1', 'click', 'new-project-btn');
  await btn.click();
  
  mark('scene-1', 'end');
});
```
