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

const files = [
  "plugins/demofly/.claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
];

for (const file of files) {
  const filePath = resolve(root, file);
  try {
    const content = JSON.parse(readFileSync(filePath, "utf-8"));

    // Top-level version
    if (content.version !== undefined) {
      content.version = version;
    }

    // marketplace.json has plugins[].version
    if (Array.isArray(content.plugins)) {
      for (const plugin of content.plugins) {
        if (plugin.version !== undefined) {
          plugin.version = version;
        }
      }
    }

    writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
    console.log(`  ✓ ${file} → ${version}`);
  } catch (err) {
    console.warn(`  ⚠ Skipped ${file}: ${err.message}`);
  }
}
