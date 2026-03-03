#!/usr/bin/env node

/**
 * create-temp-dir.js — OS-agnostic temporary directory creation for DemoFly.
 *
 * Creates a namespaced temp directory under the OS temp root (works on Linux,
 * macOS, and Windows). Uses Node.js built-in `os.tmpdir()` and `fs.mkdtemp()`
 * — no external dependencies required.
 *
 * Usage:
 *   node create-temp-dir.js <demo-name> [--type transient|session]
 *
 * Output:
 *   Prints the created directory path to stdout (for capture in shell scripts).
 *
 * Types:
 *   transient (default) — Fully ephemeral. Created under OS temp dir.
 *                          e.g. /tmp/demofly-my-demo-abc123/
 *                          OS handles cleanup on reboot.
 *
 *   session   — Demo-specific staging area. Created as demofly/<name>/.tmp/
 *               relative to cwd. Persists across tool invocations within a
 *               session but is gitignored and not part of final artifacts.
 *
 * Examples:
 *   # Create a transient temp dir for exploration screenshots
 *   TMPDIR=$(node scripts/create-temp-dir.js my-demo --type transient)
 *   echo "Screenshots go in: $TMPDIR"
 *
 *   # Create a session-local .tmp dir for draft artifacts
 *   SESSDIR=$(node scripts/create-temp-dir.js my-demo --type session)
 *   echo "Drafts go in: $SESSDIR"
 */

import { tmpdir } from 'node:os';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);

// Parse arguments
const demoName = args.find(a => !a.startsWith('--'));
const typeFlag = args.find(a => a.startsWith('--type'));
const type = typeFlag ? typeFlag.split('=')[1] || args[args.indexOf(typeFlag) + 1] || 'transient' : 'transient';

if (!demoName) {
  console.error('Usage: create-temp-dir.js <demo-name> [--type transient|session]');
  process.exit(1);
}

if (!['transient', 'session'].includes(type)) {
  console.error(`Unknown type: "${type}". Use "transient" or "session".`);
  process.exit(1);
}

async function createTransientDir(name) {
  // os.tmpdir() returns the OS-appropriate temp directory:
  //   Linux/macOS: /tmp (or $TMPDIR)
  //   Windows: C:\Users\<user>\AppData\Local\Temp (or %TEMP%)
  const prefix = join(tmpdir(), `demofly-${name}-`);
  const dir = await mkdtemp(prefix);
  return dir;
}

async function createSessionDir(name) {
  const dir = join('demofly', name, '.tmp');
  await mkdir(dir, { recursive: true });
  return dir;
}

try {
  const dir = type === 'transient'
    ? await createTransientDir(demoName)
    : await createSessionDir(demoName);

  // Print path to stdout for shell capture
  console.log(dir);
} catch (err) {
  console.error(`Failed to create ${type} temp dir: ${err.message}`);
  process.exit(1);
}
