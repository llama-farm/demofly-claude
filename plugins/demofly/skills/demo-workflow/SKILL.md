---
name: demo-workflow
description: Core knowledge for automated demo video generation — artifact formats, timing markers, human-like interaction patterns, Playwright recording, sub-agent delegation, script format, and audio-video stitching.
---

# Demo Workflow — Agent Reference

This document is the single source of truth for the demo-engineer agent. It covers
the full lifecycle of generating a product demo video: understanding the product,
proposing scenes, scripting narration, recording with Playwright, extracting timing
data, generating narration transcripts, and stitching audio to video.

Read this file before generating any artifact. When in doubt, re-read the relevant
section rather than guessing.

---

## 1. Artifact Pipeline Overview

Every demo progresses through a fixed sequence of artifacts. Each artifact feeds
the next. Never skip an artifact or generate them out of order.

```
context.md --> proposal.md --> script.md --> demo.spec.ts + playwright.config.ts
                                                |
                                                v
                                          (run recording)
                                                |
                                                v
                                          timing.json --> transcript.md --> final.mp4
```

### Artifact Reference

| Artifact | Location | Purpose |
|----------|----------|---------|
| `context.md` | `demofly/context.md` (shared) | Lightweight product understanding: URL, stack, pages, features, UI quirks. Under 60 lines. Refreshed lazily. |
| `proposal.md` | `demofly/<name>/proposal.md` | Scene outline: concept, scenes with descriptions, demo data, target total and per-scene duration. User approval checkpoint. |
| `script.md` | `demofly/<name>/script.md` | Master document: per-scene narration text, interaction sequence, sync notes mapping narration to marker IDs. |
| `demo.spec.ts` | `demofly/<name>/demo.spec.ts` | Executable Playwright test with timing markers, human-like interactions, fake cursor. |
| `playwright.config.ts` | `demofly/<name>/playwright.config.ts` | Recording configuration. |
| `timing.json` | `demofly/<name>/recordings/timing.json` | Scene and action timestamps extracted from DEMOFLY markers in console output. |
| `transcript.md` | `demofly/<name>/transcript.md` | Optional narration with TTS tags and actual durations derived from timing.json. |

### context.md Format

This file is shared across all demos for the same product. Keep it under 60 lines.
Refresh it when the product changes significantly, not on every demo run.

```markdown
# Product Context

**Name:** [Product name]
**URL:** [Running instance URL, e.g. http://127.0.0.1:3000]
**Repository:** [Path to repo root]

## Stack
- Framework: [e.g. Next.js 14, Remix, Rails 7]
- UI Library: [e.g. Tailwind + shadcn/ui, MUI, Ant Design]
- State Management: [e.g. Zustand, Redux, React Query]
- Database: [e.g. PostgreSQL via Prisma, Supabase]
- Auth: [e.g. NextAuth, Clerk, custom JWT]

## Pages / Routes
- `/` — Dashboard, shows [summary of what's visible]
- `/projects` — Project list with search and filters
- `/projects/:id` — Project detail with tabs for [...]
- [... list all significant routes]

## Key Features
- [Feature 1: brief description]
- [Feature 2: brief description]

## UI Quirks
- [Anything that affects Playwright: custom dropdowns, portals, iframes, etc.]
- [Component library specifics: data-testid patterns, role attributes]
- [Loading states, skeleton screens, animations to wait for]

## Demo Data
- [Pre-seeded accounts, sample records, API keys needed]
```

### proposal.md Format

This file requires explicit user approval before proceeding to script.md.

```markdown
# Demo Proposal: [Demo Name]

**Product:** [Product name]
**Target Duration:** [e.g. 90 seconds]
**Concept:** [One paragraph describing the demo's narrative arc]

## Scenes

### Scene 1: [Title] [target: Xs]
[2-3 sentence description of what happens and what the viewer sees]

### Scene 2: [Title] [target: Xs]
[2-3 sentence description]

[... additional scenes]

## Demo Data Requirements
- [Any test data, accounts, or preconditions needed]
- [API mocks or feature flags to enable]

## Notes
- [Any assumptions or open questions for the user]
```

---

## 2. Timing Marker System

Timing markers are the bridge between recorded video and narration audio. Every
action in demo.spec.ts emits a console log with a structured prefix. After
recording, these logs are parsed into timing.json, which drives narration timing
and ffmpeg stitching.

This is the most critical system in the pipeline. Without accurate markers, audio
and video will be misaligned.

### The Marker Helper

Place this at the top of every `demo.spec.ts`, before any test blocks:

```typescript
const t0 = Date.now();
const mark = (scene: string, action: string, target?: string) =>
  console.log(`DEMOFLY|${scene}|${action}|${target ?? ''}|${Date.now() - t0}`);
```

> **Preferred approach:** Instead of inlining the marker helper, copy the shared
> template (`plugins/demofly/templates/helpers.ts`) into the demo directory and use
> `import { createMarker } from './helpers'`. See **Section 8** for details.

Every marker line has the format:
```
DEMOFLY|<scene-id>|<action>|<target>|<elapsed-ms>
```

### Marker Vocabulary

Use exactly these action names. Do not invent new ones.

| Action | Meaning | When to Emit |
|--------|---------|--------------|
| `start` | Scene begins | First line inside each scene block |
| `end` | Scene ends | Last line inside each scene block |
| `click` | User clicks an element | Immediately before the `.click()` call |
| `type-start` | Begins typing into a field | Before `pressSequentially()` |
| `type-end` | Finishes typing into a field | After `pressSequentially()` completes |
| `wait-start` | Waiting for something | Before waiting on a loading state, transition, or animation |
| `wait-end` | Wait resolved | After the awaited condition resolves |
| `hover` | Cursor moves to element | Before moving the fake cursor to a target |
| `scroll` | Page scrolls | Before a scroll action |
| `navigate` | Page navigation or route change | After a navigation completes (e.g. after `page.goto()` or after clicking a link and waiting) |
| `pause` | Deliberate viewer pause | Before a `waitForTimeout` that exists purely for pacing |

### Usage Pattern

Every interaction in demo.spec.ts must be bracketed by markers. The pattern is:
mark before, act, mark after (where applicable).

```typescript
mark('scene-2', 'start');

mark('scene-2', 'click', 'new-project-btn');
await page.getByRole('button', { name: 'New Project' }).click();

mark('scene-2', 'type-start', 'project-name');
await page.getByLabel('Project name').pressSequentially('My Project', { delay: 35 });
mark('scene-2', 'type-end', 'project-name');

mark('scene-2', 'wait-start', 'form-validation');
await page.getByText('Name is available').waitFor();
mark('scene-2', 'wait-end', 'form-validation');

mark('scene-2', 'pause', 'let-viewer-read');
await page.waitForTimeout(1500);

mark('scene-2', 'click', 'create-btn');
await page.getByRole('button', { name: 'Create' }).click();

mark('scene-2', 'wait-start', 'redirect');
await page.waitForURL('**/projects/**');
mark('scene-2', 'wait-end', 'redirect');
mark('scene-2', 'navigate', 'project-detail');

mark('scene-2', 'end');
```

### timing.json Extraction

After recording, parse the console output to produce timing.json.

**Step 1: Capture test output.**

```bash
npx playwright test demo.spec.ts 2>&1 | tee output.log
```

**Step 2: Extract DEMOFLY lines.**

Grep for lines containing the `DEMOFLY|` prefix and strip everything before it.

**Step 3: Parse into structured JSON.**

The resulting timing.json **must** use camelCase field names to match the CLI's
`TimingData` TypeScript interface. This is critical — the CLI uses these exact
field names for audio file matching and duration formatting. Snake_case fields
will silently break the pipeline.

```json
{
  "totalDuration": 187400,
  "scenes": [
    {
      "sceneId": "scene-1",
      "startMs": 0,
      "endMs": 18400,
      "markers": [
        { "action": "click", "target": "new-project-btn", "ms": 1200 },
        { "action": "type-start", "target": "project-name", "ms": 3400 },
        { "action": "type-end", "target": "project-name", "ms": 8200 },
        { "action": "pause", "target": "let-viewer-read", "ms": 10500 },
        { "action": "click", "target": "create-btn", "ms": 12100 }
      ]
    },
    {
      "sceneId": "scene-2",
      "startMs": 18400,
      "endMs": 42100,
      "markers": []
    }
  ]
}
```

Field definitions:
- `totalDuration` — elapsed time in ms from the first `start` marker to the last `end` marker.
- `scenes[].sceneId` — matches the scene ID used in markers (scene-1, scene-2, etc.).
- `scenes[].startMs` — timestamp of the scene's `start` marker.
- `scenes[].endMs` — timestamp of the scene's `end` marker.
- `scenes[].markers` — all markers between `start` and `end`, excluding `start` and `end` themselves.

> **⚠️ Common mistake:** Do NOT use snake_case (`total_duration_ms`, `id`,
> `start_ms`, `end_ms`). The CLI's `TimingData` interface expects camelCase.
> Using the wrong field names causes `findAudioFiles()` to match nothing and
> `formatDuration()` to return NaN.

### ⛔ Anti-Patterns: timing.json Field Names

The CLI's `TimingData` interface requires **exact** camelCase field names. LLMs
frequently produce variations. Here are wrong vs right examples:

**Snake_case (most common mistake):**
```
⛔ WRONG: { "total_duration_ms": 25672, "scenes": [{ "id": "scene-1", "start_ms": 0, "end_ms": 13675 }] }
✅ RIGHT: { "totalDuration": 25672, "scenes": [{ "sceneId": "scene-1", "startMs": 0, "endMs": 13675 }] }
```

**Renamed fields (less obvious but equally broken):**
```
⛔ WRONG: { "duration": 25672, "scenes": [{ "scene_id": "scene-1", "begin": 0, "finish": 13675 }] }
⛔ WRONG: { "totalDurationMs": 25672, "scenes": [{ "name": "scene-1", "from": 0, "to": 13675 }] }
```

**The only correct field names are:**
- Top level: `totalDuration` (not `duration`, `total_duration_ms`, `totalDurationMs`)
- Scene: `sceneId` (not `id`, `scene_id`, `name`)
- Scene: `startMs` (not `start_ms`, `begin`, `from`, `start`)
- Scene: `endMs` (not `end_ms`, `finish`, `to`, `end`)
- Marker: `action`, `target`, `ms` (these three only)

**Extraction script** — this is the ONLY supported way to produce timing.json.
Do not write timing.json manually:

```bash
node -e "
const fs = require('fs');
const log = fs.readFileSync('output.log', 'utf8');
const lines = log.split('\n')
  .map(l => l.match(/DEMOFLY\|([^|]+)\|([^|]+)\|([^|]*)\|(\d+)/))
  .filter(Boolean)
  .map(m => ({ scene: m[1], action: m[2], target: m[3], ms: parseInt(m[4]) }));

const scenes = [];
let current = null;
for (const l of lines) {
  if (l.action === 'start') {
    // Use camelCase field names to match CLI's TimingData interface
    current = { sceneId: l.scene, startMs: l.ms, endMs: 0, markers: [] };
    scenes.push(current);
  } else if (l.action === 'end' && current) {
    current.endMs = l.ms;
    current = null;
  } else if (current) {
    current.markers.push({ action: l.action, target: l.target, ms: l.ms });
  }
}
const result = {
  // camelCase — must match CLI's TimingData interface exactly
  totalDuration: scenes.length ? scenes[scenes.length - 1].endMs - scenes[0].startMs : 0,
  scenes
};
fs.writeFileSync('recordings/timing.json', JSON.stringify(result, null, 2));
console.log('Wrote timing.json:', scenes.length, 'scenes,', result.totalDuration + 'ms total');
"
```

---

## 3. Human-Like Interaction Patterns

Demos must look like a real person using the product. Robotic instant clicks and
fills break immersion. Every interaction in demo.spec.ts must use the patterns
below.

### Typing

Never use `fill()`. Always use `pressSequentially()` with a per-key delay:

```typescript
await element.pressSequentially('Text to type', { delay: 35 });
```

- 35ms per keystroke produces roughly 28 characters per second.
- This feels natural without being tediously slow.
- For short values (under 10 chars) use 40-50ms delay for a slightly more deliberate feel.
- For long paragraphs (over 100 chars) use 25-30ms to avoid dragging.

### Distance-Based Cursor Delay

Real users move a mouse physically. The further the next target, the longer the
delay before interaction. Calculate this from element bounding boxes:

```typescript
import { Page, Locator, BoundingBox } from '@playwright/test';

async function moveTo(
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
    // 80ms base + 1.8ms per pixel of distance
    await page.waitForTimeout(Math.round(80 + distance * 1.8));
  }

  // Update fake cursor position to center of the target element
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

> **Preferred approach:** Instead of inlining `moveTo` and `injectCursor`, copy the
> shared template (`plugins/demofly/templates/helpers.ts`) into the demo directory and
> import them. See **Section 8** for details.

Usage in a test:

```typescript
let prevBox: BoundingBox | null = null;

const nameField = page.getByLabel('Project name');
prevBox = await moveTo(page, nameField, prevBox);
mark('scene-2', 'type-start', 'project-name');
await nameField.pressSequentially('My Project', { delay: 35 });
mark('scene-2', 'type-end', 'project-name');

const createBtn = page.getByRole('button', { name: 'Create' });
prevBox = await moveTo(page, createBtn, prevBox);
mark('scene-2', 'click', 'create-btn');
await createBtn.click();
```

### Fake DOM Cursor

Playwright operates headlessly with no visible mouse pointer. Inject a fake cursor
into the page at the start of each test so the recorded video shows where the
"user" is pointing.

Inject this immediately after `page.goto()`:

```typescript
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
```

Important notes on the fake cursor:
- It uses `position: fixed` so it stays visible during scrolling.
- `pointer-events: none` prevents it from intercepting clicks.
- The CSS `transition` creates smooth movement between positions.
- `z-index: 999999` keeps it above all page content.
- Re-inject after any full page navigation (`page.goto()`) because the DOM resets.
- After SPA route changes (clicking links within the app), the cursor persists because the DOM is not destroyed.

### Natural Pauses

Insert deliberate waits to match human pacing. These are NOT arbitrary — each
serves a specific purpose for viewer comprehension.

| Situation | Delay | Rationale |
|-----------|-------|-----------|
| After clicking a button | 300-500ms | Mimics the micro-pause before the next action |
| After a page transition | 800-1200ms | Let the new page render and the viewer orient |
| After a result appears (AI response, search results, data load) | 1500-2500ms | Give the viewer time to read the result |
| Between scenes | 1000-1500ms | Clean separation; viewer resets mental context |
| After filling a form field, before the next field | 400-600ms | Mimics glancing at the next field label |
| After hovering on a tooltip or dropdown | 800-1200ms | Viewer needs to read the hover content |

### Field Interaction Timeouts

After typing into a field, pause proportionally to the text length so the viewer
can read what was typed:

```typescript
const text = 'A description of the project and its goals';
await field.pressSequentially(text, { delay: 35 });
// Pause: 50ms per character + 500ms base
await page.waitForTimeout(text.length * 50 + 500);
```

This gives short inputs (~5 chars) about 750ms and longer inputs (~50 chars) about
3000ms, which feels right in both cases.

### Scroll Behavior

When content extends below the fold, scroll to reveal it:

```typescript
mark('scene-3', 'scroll', 'task-list');
await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
await page.waitForTimeout(600); // Let the smooth scroll finish
```

Always use `behavior: 'smooth'` for visible scrolling in demos.

---

## 4. Playwright Recording Configuration

Every demo directory gets a `playwright.config.ts` that enables video recording.

### Complete Configuration Template

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 600_000, // 10 minutes — demos can be long
  expect: {
    timeout: 30_000, // 30 seconds for assertions
  },
  use: {
    baseURL: 'http://127.0.0.1:3000', // Use IP literal — headless Chromium can misresolve 'localhost' (e.g. to IPv6)
    viewport: { width: 1280, height: 800 },
    video: 'on',
    launchOptions: {
      slowMo: 50, // Small global slowdown for smoother recording
    },
  },
  reporter: [['list']],
});
```

### Configuration Notes

- **`timeout: 600_000`** — Demos can run several minutes. The default 30s timeout
  will kill almost every demo recording.
- **`viewport: { width: 1280, height: 800 }`** — Standard 16:10 demo resolution.
  Wide enough to show most UIs without horizontal scroll. Adjust for specific
  products if needed (e.g. 1920x1080 for data-heavy dashboards).
- **`video: 'on'`** — Records video for every test run. Videos are saved to
  `test-results/` by default. Move the `.webm` file to `recordings/` after the run.
- **`slowMo: 50`** — Adds 50ms between every Playwright action. This stacks with
  the explicit pauses in the test code. Keeps the overall pace feeling unhurried.
- **`baseURL`** — The agent must update this to match the URL in `context.md`.

### Bash Tool Timeout

When executing the Playwright recording from the Bash tool, always set
a large timeout to prevent the tool from killing the recording prematurely:

```
timeout: 600000
```

This is the Bash tool's `timeout` parameter (in milliseconds), separate from
Playwright's own `timeout` config. Both must be set.

### Post-Recording File Handling

After the recording completes:

1. Find the video file: `test-results/*/video.webm`
2. Create the recordings directory: `mkdir -p demofly/<name>/recordings`
3. Move the video: `mv test-results/*/video.webm demofly/<name>/recordings/video.webm`
4. Parse console output into timing.json (see Section 2)
5. Optionally convert to mp4: `ffmpeg -i recordings/video.webm -c:v libx264 -crf 23 recordings/video.mp4`

---

## 5. Sub-Agent Delegation Strategy

The demo-engineer agent is an orchestrator. It delegates discovery work and
debugging work to sub-agents. The primary goal is parallelism: launch independent
investigations concurrently rather than sequentially.

### Product Exploration (Parallel)

When exploring a new product, ALWAYS launch both agents concurrently. Do not run
one after the other. Use multiple Task tool calls in a single message.

**Codebase Explorer** (Explore sub-agent):

```
Prompt: "Explore this codebase and provide a concise product summary. I need:
1. Product name and what it does (from README or package.json description)
2. Tech stack (framework, UI library, state management, database)
3. Key pages/routes (find route definitions or page components)
4. Notable features (what makes this product interesting)
5. UI framework specifics that affect Playwright (component library name, any custom components)
Keep the summary under 40 lines."
```

**UI Explorer** (general-purpose sub-agent):

```
Prompt: "Navigate to [URL] using Playwright MCP tools and explore the running app. I need:
1. Take a snapshot of each main page/route
2. List the key interactive elements (buttons, forms, dropdowns, navigation)
3. Note any non-standard UI components (custom dropdowns, drag-and-drop, rich text editors)
4. Identify the primary user flows visible from the UI
5. Note any authentication requirements
Keep the summary under 40 lines. Focus on what you can see and interact with."
```

**Launch both in parallel** using multiple Task tool calls in a single message.
Do NOT wait for one to finish before launching the other.

### Synthesizing Results

After both sub-agents return, the orchestrator reads both summaries and writes
`demofly/context.md` by combining:

- **Static findings** (from the codebase explorer): stack, routes, architecture
- **Dynamic findings** (from the UI explorer): actual page content, interactive
  elements, visual layout, authentication flows

Where findings conflict (e.g., a route exists in code but is not reachable in the
UI), note the discrepancy in the UI Quirks section of context.md.

### Debugging Delegation

When a Playwright test fails during recording, delegate diagnosis to a
general-purpose sub-agent rather than debugging inline. This keeps the
orchestrator focused on the overall workflow.

```
Prompt: "This Playwright test failed. Here's the error:
[paste error output]

Here's the relevant section of demo.spec.ts:
[paste failing code section]

This scene should: [describe what it's supposed to do from script.md]

Diagnose the failure and provide specific code fixes. Common causes:
- Selector changed (element text or role differs from what the test expects)
- Timing issue (element not yet visible, animation not finished)
- Navigation issue (URL pattern changed, redirect added)
- Data issue (expected data not present, different seed state)
"
```

### Debug-Fix Cycle Limits

1. Apply the sub-agent's suggested fixes.
2. Re-run the recording.
3. If it fails again, delegate again with the new error.
4. Maximum 3 debug-fix cycles. After 3 failures, stop and ask the user for help.
   Present: the original error, all attempted fixes, and the current error.

### When to Use Sub-Agents vs. Doing It Yourself

| Task | Approach |
|------|----------|
| Initial product exploration | Parallel sub-agents (always) |
| Writing proposal.md, script.md | Orchestrator does this directly |
| Writing demo.spec.ts | Orchestrator does this directly |
| Debugging test failures | Sub-agent delegation |
| Checking if a URL is reachable | Quick inline check (no sub-agent needed) |
| Exploring a complex page with many interactions | Sub-agent with Playwright MCP |

---

## 6. script.md — Beat-Centric Format

The script is the master document that connects narration to Playwright actions.
Instead of separate narration/interactions/sync blocks, it uses **beats** — the
atomic unit that pairs a narration fragment with its ordered actions and a timing
marker. Each scene is composed of numbered beats. Each beat produces one TTS audio
clip for stitching.

### Beat Heading Format

```
### {scene}.{beat} — {label}  → `{marker-id}`
```

Example: `### 2.3 — Submit  → `scene-2:click:create-btn``

The numbering is `{scene number}.{beat number within scene}`. The marker ID after
`→` must match a `mark()` call in demo.spec.ts.

The colon-delimited IDs in beat headings (e.g. `scene-2:click:create-btn`) are
compact shorthand for the three arguments passed to `mark(scene, action, target)`.
At runtime, `mark()` emits pipe-delimited console output
(`DEMOFLY|scene-2|click|create-btn|1234`). The two representations carry identical
information — colons are for human-readable script headings, pipes are for
machine-parseable console logs. Do not treat them as separate formats.

### Beat Body Format

A markdown table with `Words` and `Action` columns:

```markdown
| Words | Action |
|-------|--------|
| "Let's create a new project." | Click "+ New Project" button |
| *(wait)* | Wait for modal to appear |
```

**Table rules:**

1. Each row pairs a narration phrase with the action happening during/alongside it.
2. **Multi-action continuation** — When a single phrase maps to multiple sequential
   actions, use continuation rows with an empty Words cell.
3. **Silent beats** — No narration. Use `*(silence — description)*` in the Words
   cell. These are natural TTS splitting points.
4. **Static beats** — Narration over a still screen. Words are present but Action
   is `*(screen static)*`.
5. Rows are ordered chronologically — top to bottom is the execution order.

### Format Rules

1. Beat IDs use `{scene}.{beat}` numbering (e.g., 1.1, 1.2, 2.1).
2. Every beat heading MUST include a marker ID after `→` that exists in
   demo.spec.ts.
3. Scene headings use `## Scene N: Title [target: Xs]` — same as before.
4. Target duration is guidance, not a hard limit.
5. Every scene must have at least one beat.
6. Beats within a scene are ordered by execution sequence.

### Writing Good Narration

- **Conversational, not corporate.** Write like you are showing the product to a
  colleague, not presenting to a board room.
- **1-3 sentences per beat.** Each beat's narration should be a natural "breath
  group" for TTS.
- **Match narration to actions.** The Words column should describe what is happening
  in the Action column of the same beat.
- **Avoid filler.** Do not say "as you can see" or "now I'm going to" — just
  describe what is happening and why it matters.
- **Highlight value.** Instead of "click the Export button", say "Export the report
  with one click."
- **Let the visuals speak.** Silent beats give the viewer a moment to absorb what
  just happened on screen — do not narrate every click.

### Complete Example

```markdown
# Script: TaskFlow Demo

**Product:** TaskFlow
**Target duration:** 90s
**Scenes:** 4

---

## Scene 1: First Impression [target: 15s]

### 1.1 — Introduction  → `scene-1:start`

| Words | Action |
|-------|--------|
| "TaskFlow gives your team a single place to track every project." | Navigate to dashboard; page loads |

### 1.2 — Dashboard Tour  → `scene-1:hover:active-projects`

| Words | Action |
|-------|--------|
| "Here's the dashboard —" | Hover "Active Projects" card |
| "active projects, recent activity, team availability at a glance." | Hover "Team Availability" panel |

### 1.3 — Transition  → `scene-1:click:new-project-btn`

| Words | Action |
|-------|--------|
| "Let's create something new." | Click "+ New Project" button |

---

## Scene 2: Create a Project [target: 25s]

### 2.1 — Open Form  → `scene-2:click:new-project-btn`

| Words | Action |
|-------|--------|
| "We'll start by clicking New Project." | Click "+ New Project" button |
| *(silence — modal opens)* | Wait for modal to appear |

### 2.2 — Fill Form  → `scene-2:type-start:project-name`

| Words | Action |
|-------|--------|
| "Give it a name," | Type "Q1 Marketing Campaign" in name field |
| "set a deadline," | Click deadline date picker |
|  | Select March 15 |
| "and assign a team lead." | Open team lead dropdown |
|  | Select "Sarah Chen" |

### 2.3 — Submit  → `scene-2:click:create-btn`

| Words | Action |
|-------|--------|
| "That's it — you're ready to go." | Click "Create Project" |
| *(silence — viewer watches redirect)* | Wait for redirect to project page |

---

## Scene 3: AI Suggestions [target: 30s]

### 3.1 — Trigger AI  → `scene-3:click:suggest-btn`

| Words | Action |
|-------|--------|
| "Here's where it gets interesting." | Click "AI Suggest Tasks" button |

### 3.2 — Watch AI Work  → `scene-3:wait-start:ai-suggestions`

| Words | Action |
|-------|--------|
| "TaskFlow's AI analyzes the project and suggests tasks automatically." | *(screen static — spinner visible)* |
| *(silence — let viewer watch the loading)* | Wait for suggestions to appear |

### 3.3 — Review Results  → `scene-3:wait-end:ai-suggestions`

| Words | Action |
|-------|--------|
| "It even estimates time for each task based on your team's history." | Hover first suggested task to highlight the time estimate |
| | Hover second suggested task |

### 3.4 — Accept  → `scene-3:click:accept-all-btn`

| Words | Action |
|-------|--------|
| "Accept them all with one click." | Click "Accept All" button |
| *(silence — tasks populate the board)* | Wait for task list to update |

---

## Scene 4: Wrap Up [target: 10s]

### 4.1 — Return to Dashboard  → `scene-4:navigate:dashboard`

| Words | Action |
|-------|--------|
| "Back on the dashboard, the new project is already tracked." | Navigate to dashboard |

### 4.2 — Closing  → `scene-4:pause:final`

| Words | Action |
|-------|--------|
| "That's TaskFlow. From zero to a fully planned project in under two minutes." | *(screen static)* |
```

---

## 7. Transcript and Stitching

The cardinal rule: **record first, narrate second.** Video timing is variable and
unpredictable. Network latency, animation durations, and page load times all
affect how long each scene actually takes. Narration must adapt to the video, not
the other way around.

### Workflow

1. Run the Playwright recording and capture console output.
2. Extract timing.json from DEMOFLY markers (Section 2).
3. Generate transcript.md using actual scene durations from timing.json.
4. Generate per-scene audio files (via TTS API or manual recording).
5. Stitch audio onto video using ffmpeg with timing-based delays.

### transcript.md Format

```markdown
# Demo Transcript: [Demo Name]

Generated from timing.json after recording on [date].

## Scene 1: Dashboard Overview

### Beat 1.1 — Introduction [at 0ms, window: 5.2s]

[warmly] TaskFlow gives your team a single place to track every
project.

### Beat 1.2 — Dashboard Tour [at 5200ms, window: 4.6s]

Here's the dashboard — [pause: 0.3s] active projects, recent
activity, team availability at a glance.

### Beat 1.3 — Transition [at 9800ms, window: 2.6s]

Let's create something new.

## Scene 2: Create a Project

### Beat 2.1 — Open Form [at 12400ms, window: 3.8s]

[confidently] We'll start by clicking New Project.

_(Beat 2.1 silent portion: modal opens — no audio)_

### Beat 2.2 — Fill Form [at 16200ms, window: 8.1s]

Give it a name, [pause: 0.3s] set a deadline, [pause: 0.3s]
and assign a team lead.

### Beat 2.3 — Submit [at 24300ms, window: 3.2s]

[casual] That's it — you're ready to go.

_(Beat 2.3 silent portion: redirect — no audio)_
```

Silent beats from script.md are omitted from the transcript (they produce no
audio). If a beat has both narration and a silent portion, a note is included but
no audio is generated for the silent part.

### Key Differences from script.md

| Aspect | script.md | transcript.md |
|--------|-----------|---------------|
| Timing | Target estimates | Actual beat timestamps from timing.json |
| Purpose | Guides Playwright actions | Guides TTS / narration audio generation |
| Narration | Draft text in Words column | Final text with TTS emotion and pacing tags |
| Structure | Beats with Words/Action tables | Beat narration text only (no actions) |
| Created | Before recording | After recording |

### TTS Tag Format

Tags are compatible with ElevenLabs v3 and similar TTS services.

**Emotion tags** — place before the sentence they affect:
- `[warmly]` — friendly, welcoming tone. Use for introductions.
- `[confidently]` — assured, knowledgeable tone. Use for feature explanations.
- `[excited]` — energetic, enthusiastic tone. Use for impressive features.
- `[impressed]` — mildly surprised, appreciative tone. Use for "wow" moments.
- `[casual]` — relaxed, conversational tone. Use for transitions and minor steps.
- `[serious]` — measured, professional tone. Use for security or compliance features.

**Pacing tags** — insert inline:
- `[pause: 0.3s]` — short breath pause
- `[pause: 0.5s]` — clause break
- `[pause: 1.0s]` — scene transition pause

**Usage guidelines:**
- Do not over-tag. One emotion tag per 2-3 sentences is enough.
- Pauses should feel natural, not mechanical.
- If the available window is much longer than the read time, add pauses rather
  than adding more words. Silence during a visual demo is fine — the viewer is
  watching the screen.

### Adjusting Narration to Fit Timing

After generating transcript.md, check each beat:

- **Read time < per-beat window**: Good. Add `[pause]` tags or let silence fill
  the gap. Silence while the viewer watches an action is natural.
- **Read time > per-beat window**: Trim the narration. Cut adjectives and filler
  first. If still too long, split into two sentences and drop the less important
  one. Never speed-read — reduce content instead.
- **Rule of thumb**: Narration should fill 40-70% of the beat's available window.
  The rest is natural silence while the viewer watches the interactions.

### Stitching with ffmpeg

**The key concept:** Each beat in script.md has a marker. After recording,
timing.json records the exact timestamp of that marker. Each beat's TTS audio
clip is positioned at its marker timestamp using ffmpeg's `adelay` filter.

**Input files:**
- `recordings/video.mp4` (or `.webm`) — the Playwright recording
- `narration/beat-1.1.mp3` — audio for beat 1.1
- `narration/beat-1.2.mp3` — audio for beat 1.2
- ... one file per beat that has narration (silent beats have no audio file)

**The ffmpeg command:**
```bash
ffmpeg -i recordings/video.mp4 \
  -i narration/beat-1.1.mp3 \
  -i narration/beat-1.2.mp3 \
  -i narration/beat-1.3.mp3 \
  -i narration/beat-2.1.mp3 \
  -i narration/beat-2.2.mp3 \
  -i narration/beat-2.3.mp3 \
  -filter_complex "
    [1:a]adelay=0|0[a1];
    [2:a]adelay=5200|5200[a2];
    [3:a]adelay=9800|9800[a3];
    [4:a]adelay=12400|12400[a4];
    [5:a]adelay=16200|16200[a5];
    [6:a]adelay=24300|24300[a6];
    [a1][a2][a3][a4][a5][a6]amix=inputs=6:duration=longest[aout]
  " \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac \
  recordings/final.mp4
```

**How it works:**
- Each `-i` adds an audio input: one per narrated beat.
- `adelay=X|X` delays the audio by X milliseconds. The value comes from each
  beat's marker timestamp in timing.json.
- `amix=inputs=N:duration=longest` mixes all audio streams.
- `-c:v copy` copies video without re-encoding.

**Constructing this dynamically:**

```typescript
const timing = JSON.parse(fs.readFileSync('recordings/timing.json', 'utf8'));

// Collect all beat markers with their timestamps
const beats: { id: string; ms: number }[] = [];
for (const scene of timing.scenes) {
  // Each marker in timing.json corresponds to a beat's marker
  // Match against the beat IDs from script.md
  for (const marker of scene.markers) {
    beats.push({ id: `${scene.id.replace('scene-', '')}.${beats.filter(b => b.id.startsWith(scene.id.replace('scene-', '') + '.')).length + 1}`, ms: marker.ms });
  }
}

// Filter to only beats that have narration audio files
const narratedBeats = beats.filter(b =>
  fs.existsSync(`narration/beat-${b.id}.mp3`)
);

const inputs = narratedBeats.map(b => `-i narration/beat-${b.id}.mp3`).join(' \\\n  ');
const delays = narratedBeats.map((b, i) =>
  `[${i + 1}:a]adelay=${b.ms}|${b.ms}[a${i + 1}]`
).join(';\n    ');
const mixInputs = narratedBeats.map((_, i) => `[a${i + 1}]`).join('');
const n = narratedBeats.length;

const cmd = `ffmpeg -i recordings/video.mp4 \\
  ${inputs} \\
  -filter_complex "
    ${delays};
    ${mixInputs}amix=inputs=${n}:duration=longest[aout]
  " \\
  -map 0:v -map "[aout]" \\
  -c:v copy -c:a aac \\
  recordings/final.mp4`;
```

**Key advantage over per-scene stitching:** If an API call takes longer than
expected during recording, subsequent beat markers shift naturally. Each beat's
audio is still positioned at its actual marker timestamp — no misalignment.

### Intra-Scene Alignment

With per-beat stitching, intra-scene alignment is the default behavior. Each beat
within a scene has its own marker timestamp and its own audio clip, so narration
is automatically positioned at the correct moment — no manual splitting or silence
padding required.

This eliminates the need for the scene-level workarounds (splitting scene audio
or prepending silence) that were necessary with per-scene stitching.

### Final Quality Checks

After stitching, verify:
1. **Audio starts and stops at reasonable times.** Play the first and last 10
   seconds of the final video.
2. **No audio overlap between beats.** Each beat's audio should finish before
   the next beat's audio begins. If overlap occurs, trim the earlier beat's
   audio.
3. **Volume is consistent.** If one scene's audio is significantly louder or
   quieter, normalize before stitching:
   ```bash
   ffmpeg -i scene-1.mp3 -af "loudnorm=I=-16:TP=-1.5:LRA=11" scene-1-norm.mp3
   ```
4. **Video and audio total durations match.** The final video should not have a
   long silent tail or cut off audio early.

---

## 8. Shared Helpers Template

The helper functions used across all demos (`createMarker`, `moveTo`, `injectCursor`)
are maintained in a single template file. This is the source of truth — copy it into
each demo directory rather than writing these functions inline.

### Template Location

```
plugins/demofly/templates/helpers.ts
```

### Setup

Copy the template into the demo directory before writing `demo.spec.ts`:

```bash
cp plugins/demofly/templates/helpers.ts demofly/<name>/helpers.ts
```

### Usage in demo.spec.ts

Import the helpers and use them directly:

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

### What the Helpers Do

- **`createMarker()`** — Factory that captures `Date.now()` and returns a bound `mark(scene, action, target?)` function. Each spec gets its own `t0`.
- **`moveTo(page, element, prevBox?)`** — Calculates pixel distance from previous bounding box, waits proportionally (80ms base + 1.8ms/px), then updates the fake cursor position. Returns the new bounding box.
- **`injectCursor(page)`** — Injects the `#demofly-cursor` div with fixed positioning, transitions, and high z-index. **Must be re-called after each full-page navigation** (`page.goto()`) because the DOM resets.

### Customization

The template is a copy, not a shared import. If a specific demo needs different timing
constants or cursor styling, modify the local copy. The template provides consistent
defaults across demos.
