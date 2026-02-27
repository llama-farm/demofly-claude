import { Page, Locator, BoundingBox } from '@playwright/test';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

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
