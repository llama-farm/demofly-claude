#!/usr/bin/env node

/**
 * Syncs the release version to plugin.json and marketplace.json.
 * Called by release-it before:bump hook.
 *
 * Usage: node scripts/sync-version.js <version>
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/sync-version.js <version>");
  process.exit(1);
}

const filePath = resolve(root, "plugins/demofly/.claude-plugin/plugin.json");
try {
  const content = JSON.parse(readFileSync(filePath, "utf-8"));
  content.version = version;
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`  ✓ plugin.json → ${version}`);
} catch (err) {
  console.error(`  ✗ Failed to update plugin.json: ${err.message}`);
  process.exit(1);
}
