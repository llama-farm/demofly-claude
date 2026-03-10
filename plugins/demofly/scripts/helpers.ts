import { Page, Locator, BoundingBox } from '@playwright/test';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export class ResolveError extends Error {
  constructor(
    public readonly description: string,
    public readonly selectorsTriedCount: number,
    public readonly snapshot: string
  ) {
    super(
      `Failed to resolve "${description}". Tried ${selectorsTriedCount} selectors.\n\nPage snapshot (truncated):\n${snapshot.slice(0, 2000)}`
    );
    this.name = 'ResolveError';
  }
}

export async function resolve(
  page: Page,
  opts: {
    description: string;
    selectors: (() => Locator)[];
    timeout?: number;
  }
): Promise<Locator> {
  const { description, selectors, timeout = 5000 } = opts;

  for (const factory of selectors) {
    try {
      const locator = factory();
      await locator.first().waitFor({ state: 'visible', timeout });
      const count = await locator.count();
      if (count === 1) {
        return locator;
      }
      // Multiple matches — try the next selector
    } catch {
      // Timeout, zero matches, or factory threw — try the next selector
    }
  }

  let snapshot = '';
  try {
    snapshot = (await page.accessibility.snapshot())
      ? JSON.stringify(await page.accessibility.snapshot(), null, 2)
      : '';
  } catch {
    snapshot = '<snapshot unavailable>';
  }

  throw new ResolveError(description, selectors.length, snapshot);
}

export function createMarker(): (scene: string, action: string, target?: string) => void {
  const t0 = Date.now();
  return (scene: string, action: string, target?: string) =>
    console.log(`DEMOFLY|${scene}|${action}|${target ?? ''}|${Date.now() - t0}`);
}

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

/**
 * Create an OS-agnostic temporary directory for transient demo artifacts
 * (exploration screenshots, debug captures, intermediate files).
 *
 * Uses `os.tmpdir()` for cross-platform compatibility:
 *   - Linux/macOS: /tmp or $TMPDIR
 *   - Windows: %TEMP% (e.g. C:\Users\<user>\AppData\Local\Temp)
 *
 * The directory is namespaced by demo name with a unique suffix to avoid
 * collisions between concurrent runs.
 *
 * @param demoName - The demo slug (e.g. "product-tour")
 * @returns The absolute path to the created temp directory
 */
export async function createTempDir(demoName: string): Promise<string> {
  const prefix = join(tmpdir(), `demofly-${demoName}-`);
  return mkdtemp(prefix);
}

/**
 * Create (or ensure existence of) a session-local .tmp directory for
 * demo-specific intermediate artifacts (draft scripts, planning screenshots,
 * session logs). These persist across tool invocations but are gitignored.
 *
 * @param demoDir - Path to the demo directory (e.g. "demofly/product-tour")
 * @returns The absolute path to the .tmp subdirectory
 */
export async function createSessionTmpDir(demoDir: string): Promise<string> {
  const dir = join(demoDir, '.tmp');
  await mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Wait until a target time offset within a scene has elapsed.
 * Used to pace Playwright actions to audio timestamp targets.
 *
 * @param page - Playwright page instance
 * @param sceneStart - Date.now() captured at scene start
 * @param targetMs - Target offset in ms from scene start
 * @param minMs - Minimum wait time to avoid zero-waits (default 200ms)
 */
export async function waitUntil(
  page: Page,
  sceneStart: number,
  targetMs: number,
  minMs = 200
): Promise<void> {
  const elapsed = Date.now() - sceneStart;
  const waitMs = Math.max(minMs, targetMs - elapsed);
  await page.waitForTimeout(waitMs);
}

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
