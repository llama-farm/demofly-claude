#!/usr/bin/env node

/**
 * Deterministic extraction of structural product context for demofly.
 *
 * Detects framework, stack, routes, and dev-server port from a project root.
 * Computes a SHA-256 fingerprint over key input files so the pipeline can
 * cheaply decide whether demofly/context.md needs a refresh.
 *
 * Exported functions:
 *   extractStructuralContext(projectRoot) → { name, url, stack, routes, inputHash }
 *   computeStructuralHash(projectRoot)   → string (SHA-256 hex)
 *   diffStructuralHash(projectRoot, previousHash) → { changed: boolean, categories: string[] }
 *
 * CLI usage:
 *   node extract-context-structural.js <project-root>              # full extraction
 *   node extract-context-structural.js <project-root> --hash-only  # hash only (~50ms)
 *   node extract-context-structural.js <project-root> --diff <previous-hash>
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

// ---------------------------------------------------------------------------
// Manifest detection
// ---------------------------------------------------------------------------

const MANIFEST_FILENAMES = [
  'package.json',
  'Cargo.toml',
  'pyproject.toml',
  'Gemfile',
  'go.mod',
  'composer.json',
  'pubspec.yaml',
  'build.gradle',
  'pom.xml',
];

function findManifest(root) {
  for (const name of MANIFEST_FILENAMES) {
    const p = join(root, name);
    if (existsSync(p)) return { path: p, type: name };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Framework & stack detection (from package.json dependencies)
// ---------------------------------------------------------------------------

const FRAMEWORK_PROBES = [
  { dep: 'next', name: 'Next.js' },
  { dep: 'nuxt', name: 'Nuxt' },
  { dep: '@remix-run/react', name: 'Remix' },
  { dep: 'astro', name: 'Astro' },
  { dep: '@angular/core', name: 'Angular' },
  { dep: 'svelte', name: 'Svelte' },
  { dep: '@sveltejs/kit', name: 'SvelteKit' },
  { dep: 'vue', name: 'Vue' },
  { dep: 'react', name: 'React' },
  { dep: 'solid-js', name: 'Solid' },
  { dep: 'preact', name: 'Preact' },
];

const UI_LIBRARY_PROBES = [
  { dep: '@mui/material', name: 'MUI' },
  { dep: 'antd', name: 'Ant Design' },
  { dep: '@chakra-ui/react', name: 'Chakra UI' },
  { dep: '@radix-ui/react-dialog', name: 'Radix UI' },
  { dep: '@mantine/core', name: 'Mantine' },
  { dep: 'tailwindcss', name: 'Tailwind CSS' },
  { dep: '@tailwindcss/vite', name: 'Tailwind CSS' },
];

const STATE_PROBES = [
  { dep: 'zustand', name: 'Zustand' },
  { dep: 'redux', name: 'Redux' },
  { dep: '@reduxjs/toolkit', name: 'Redux Toolkit' },
  { dep: '@tanstack/react-query', name: 'React Query' },
  { dep: 'jotai', name: 'Jotai' },
  { dep: 'recoil', name: 'Recoil' },
  { dep: 'mobx', name: 'MobX' },
  { dep: 'pinia', name: 'Pinia' },
  { dep: 'vuex', name: 'Vuex' },
];

const DB_PROBES = [
  { dep: 'prisma', name: 'Prisma' },
  { dep: '@prisma/client', name: 'Prisma' },
  { dep: 'drizzle-orm', name: 'Drizzle' },
  { dep: 'mongoose', name: 'Mongoose' },
  { dep: 'sequelize', name: 'Sequelize' },
  { dep: 'typeorm', name: 'TypeORM' },
  { dep: '@supabase/supabase-js', name: 'Supabase' },
  { dep: 'firebase', name: 'Firebase' },
  { dep: '@firebase/firestore', name: 'Firebase' },
  { dep: 'better-sqlite3', name: 'SQLite' },
];

const AUTH_PROBES = [
  { dep: 'next-auth', name: 'NextAuth' },
  { dep: '@auth/core', name: 'Auth.js' },
  { dep: '@clerk/nextjs', name: 'Clerk' },
  { dep: 'passport', name: 'Passport.js' },
  { dep: '@supabase/auth-helpers-nextjs', name: 'Supabase Auth' },
  { dep: 'firebase-auth', name: 'Firebase Auth' },
];

const BUNDLER_PROBES = [
  { dep: 'vite', name: 'Vite' },
  { dep: 'webpack', name: 'Webpack' },
  { dep: 'esbuild', name: 'esbuild' },
  { dep: 'turbopack', name: 'Turbopack' },
  { dep: 'parcel', name: 'Parcel' },
];

function probeAll(allDeps, probes) {
  for (const { dep, name } of probes) {
    if (allDeps.has(dep)) return name;
  }
  return null;
}

function detectStackFromPackageJson(manifest) {
  const pkg = JSON.parse(readFileSync(manifest.path, 'utf8'));
  const allDeps = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);

  const framework = probeAll(allDeps, FRAMEWORK_PROBES);
  const bundler = probeAll(allDeps, BUNDLER_PROBES);
  const uiLibrary = probeAll(allDeps, UI_LIBRARY_PROBES);
  const stateManagement = probeAll(allDeps, STATE_PROBES);
  const database = probeAll(allDeps, DB_PROBES);
  const auth = probeAll(allDeps, AUTH_PROBES);

  // Build version strings where possible
  const version = (dep) => {
    const v = (pkg.dependencies || {})[dep] || (pkg.devDependencies || {})[dep];
    return v ? v.replace(/[\^~>=<]/g, '').split('.')[0] : null;
  };

  const frameworkVersion = framework
    ? (() => {
        const probe = FRAMEWORK_PROBES.find((p) => allDeps.has(p.dep));
        const v = probe ? version(probe.dep) : null;
        return v ? `${framework} ${v}` : framework;
      })()
    : null;

  const bundlerVersion = bundler
    ? (() => {
        const probe = BUNDLER_PROBES.find((p) => allDeps.has(p.dep));
        const v = probe ? version(probe.dep) : null;
        return v ? `${bundler} ${v}` : bundler;
      })()
    : null;

  return {
    name: pkg.name || basename(manifest.path.replace(/\/package\.json$/, '')),
    framework: frameworkVersion,
    bundler: bundlerVersion,
    uiLibrary,
    stateManagement,
    database,
    auth,
    allDeps: [...allDeps].sort(),
  };
}

function detectStack(root, manifest) {
  if (!manifest) {
    return { name: basename(root), framework: null, bundler: null, uiLibrary: null, stateManagement: null, database: null, auth: null, allDeps: [] };
  }
  if (manifest.type === 'package.json') {
    return detectStackFromPackageJson(manifest);
  }
  // For non-JS manifests, return basic info — extend as needed
  const content = readFileSync(manifest.path, 'utf8');
  const name = basename(root);
  return { name, framework: manifest.type.replace(/\..+$/, ''), bundler: null, uiLibrary: null, stateManagement: null, database: null, auth: null, allDeps: [], rawManifest: content };
}

// ---------------------------------------------------------------------------
// Route detection
// ---------------------------------------------------------------------------

const ROUTE_DIRS = [
  'app',            // Next.js App Router, Remix
  'pages',          // Next.js Pages Router, Nuxt
  'src/routes',     // SvelteKit, Remix (Vite)
  'src/pages',      // Astro, some React setups
  'src/app',        // Angular, some Next.js
  'routes',         // Remix classic
];

function listDirRecursive(dir, prefix = '') {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const entries = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      entries.push(...listDirRecursive(join(dir, entry.name), rel));
    } else {
      entries.push(rel);
    }
  }
  return entries;
}

function detectRoutes(root, framework) {
  // Try file-based routing directories
  for (const dir of ROUTE_DIRS) {
    const full = join(root, dir);
    if (existsSync(full) && statSync(full).isDirectory()) {
      const files = listDirRecursive(full).sort();
      if (files.length > 0) {
        return { dir, files };
      }
    }
  }

  // Fallback: SPA with single route
  return { dir: null, files: ['/'] };
}

// ---------------------------------------------------------------------------
// Port detection
// ---------------------------------------------------------------------------

const FRAMEWORK_DEFAULT_PORTS = {
  'Next.js': 3000,
  'Nuxt': 3000,
  'Remix': 5173,
  'Astro': 4321,
  'Angular': 4200,
  'SvelteKit': 5173,
  'Svelte': 5173,
  'Vue': 5173,
  'React': 5173,   // Vite default
  'Solid': 3000,
  'Preact': 5173,
};

function detectPort(root, framework) {
  // Check common config files for port settings
  const configPatterns = [
    'vite.config.ts', 'vite.config.js', 'vite.config.mjs',
    'next.config.ts', 'next.config.js', 'next.config.mjs',
    'nuxt.config.ts', 'nuxt.config.js',
    'astro.config.ts', 'astro.config.mjs',
    'angular.json',
    'svelte.config.js',
  ];

  for (const cfg of configPatterns) {
    const p = join(root, cfg);
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf8');
      // Look for port: NNNN patterns
      const match = content.match(/port\s*[:=]\s*(\d{2,5})/);
      if (match) return parseInt(match[1], 10);
    }
  }

  // Check .env files
  for (const envFile of ['.env', '.env.local', '.env.development']) {
    const p = join(root, envFile);
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf8');
      const match = content.match(/(?:PORT|VITE_PORT|DEV_PORT)\s*=\s*(\d{2,5})/);
      if (match) return parseInt(match[1], 10);
    }
  }

  // Framework default
  const base = framework ? framework.replace(/\s+\d+$/, '') : null;
  if (base && FRAMEWORK_DEFAULT_PORTS[base]) {
    return FRAMEWORK_DEFAULT_PORTS[base];
  }

  return 3000; // generic fallback
}

// ---------------------------------------------------------------------------
// Config file discovery
// ---------------------------------------------------------------------------

function findConfigFiles(root) {
  const configs = [];
  try {
    const entries = readdirSync(root);
    for (const entry of entries) {
      // Match *.config.{ts,js,mjs} and specific known configs
      if (
        /\.config\.(ts|js|mjs|cjs)$/.test(entry) ||
        entry === 'angular.json' ||
        entry === 'tsconfig.json' ||
        entry === 'tailwind.config.js' ||
        entry === 'tailwind.config.ts' ||
        entry === 'postcss.config.js' ||
        entry === 'postcss.config.mjs'
      ) {
        configs.push(join(root, entry));
      }
    }
  } catch {
    // root may not exist
  }
  return configs.sort();
}

// ---------------------------------------------------------------------------
// Structural hash computation
// ---------------------------------------------------------------------------

function buildHashInputs(root) {
  const inputs = { manifest: '', configs: '', routeListing: '' };

  // 1. Manifest contents
  const manifest = findManifest(root);
  if (manifest) {
    inputs.manifest = readFileSync(manifest.path, 'utf8');
  }

  // 2. Config file contents
  const configs = findConfigFiles(root);
  inputs.configs = configs
    .map((p) => {
      try { return readFileSync(p, 'utf8'); } catch { return ''; }
    })
    .join('\n---\n');

  // 3. Route directory listing (sorted file paths, not contents)
  const stack = manifest ? detectStack(root, manifest) : null;
  const routes = detectRoutes(root, stack?.framework);
  if (routes.dir) {
    inputs.routeListing = routes.files.join('\n');
  }

  return inputs;
}

/**
 * Compute a SHA-256 hash over the structural inputs of a project.
 * @param {string} projectRoot
 * @returns {string} hex digest
 */
export function computeStructuralHash(projectRoot) {
  const inputs = buildHashInputs(projectRoot);
  const combined = [inputs.manifest, inputs.configs, inputs.routeListing].join('\n===\n');
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Compare the current structural hash to a previous one and report what changed.
 * @param {string} projectRoot
 * @param {string} previousHash
 * @returns {{ changed: boolean, categories: string[] }}
 */
export function diffStructuralHash(projectRoot, previousHash) {
  const inputs = buildHashInputs(projectRoot);
  const currentHash = createHash('sha256')
    .update([inputs.manifest, inputs.configs, inputs.routeListing].join('\n===\n'))
    .digest('hex');

  if (currentHash === previousHash) {
    return { changed: false, categories: [], currentHash };
  }

  // Determine what category of change occurred by hashing each input separately
  const categories = [];

  const hashOf = (s) => createHash('sha256').update(s).digest('hex');

  // We can't compare individual sub-hashes to the previous combined hash,
  // but we can rebuild from scratch and compare each piece.
  // The caller should store the previous inputs' sub-hashes if they want
  // fine-grained diff. For now, we use heuristics:

  // Check routes: if route listing changed
  const prevInputs = buildHashInputsFromPreviousContext(projectRoot);
  if (prevInputs) {
    if (hashOf(inputs.routeListing) !== hashOf(prevInputs.routeListing)) {
      categories.push('routes_changed');
    }
    if (hashOf(inputs.manifest) !== hashOf(prevInputs.manifest)) {
      categories.push('deps_changed');
    }
    if (hashOf(inputs.configs) !== hashOf(prevInputs.configs)) {
      categories.push('config_changed');
    }
  } else {
    // Can't determine specifics without previous state — report generic change
    categories.push('structural_changed');
  }

  // If nothing specific detected but hash differs, it's metadata
  if (categories.length === 0) {
    categories.push('metadata_changed');
  }

  return { changed: true, categories, currentHash };
}

/**
 * Try to read previous hash inputs from existing context.md frontmatter.
 * Returns null if no usable previous state exists.
 */
function buildHashInputsFromPreviousContext(projectRoot) {
  // This is a best-effort function. In practice, the diff is computed by
  // comparing individual sub-hashes stored in frontmatter. For the initial
  // implementation, we return null and the caller gets 'structural_changed'.
  return null;
}

/**
 * Extract full structural context from a project root.
 * @param {string} projectRoot
 * @returns {{ name: string, url: string, stack: object, routes: object, inputHash: string }}
 */
export function extractStructuralContext(projectRoot) {
  const manifest = findManifest(projectRoot);
  const stack = detectStack(projectRoot, manifest);
  const routes = detectRoutes(projectRoot, stack.framework);
  const port = detectPort(projectRoot, stack.framework);
  const inputHash = computeStructuralHash(projectRoot);

  return {
    name: stack.name,
    url: `http://127.0.0.1:${port}`,
    stack: {
      framework: stack.framework,
      bundler: stack.bundler,
      uiLibrary: stack.uiLibrary,
      stateManagement: stack.stateManagement,
      database: stack.database,
      auth: stack.auth,
    },
    routes: {
      dir: routes.dir,
      paths: routes.files,
    },
    inputHash,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
const isCLI = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isCLI) {
  const args = process.argv.slice(2);
  const projectRoot = args.find((a) => !a.startsWith('--'));
  const hashOnly = args.includes('--hash-only');
  const diffFlag = args.includes('--diff');
  const previousHash = diffFlag ? args[args.indexOf('--diff') + 1] : null;

  if (!projectRoot) {
    console.error('Usage: node extract-context-structural.js <project-root> [--hash-only] [--diff <hash>]');
    process.exit(1);
  }

  if (hashOnly) {
    const hash = computeStructuralHash(projectRoot);
    console.log(hash);
  } else if (diffFlag && previousHash) {
    const result = diffStructuralHash(projectRoot, previousHash);
    console.log(JSON.stringify(result, null, 2));
  } else {
    const result = extractStructuralContext(projectRoot);
    console.log(JSON.stringify(result, null, 2));
  }
}
