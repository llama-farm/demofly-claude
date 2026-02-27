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
                                          timing.json --> transcript.md
                                                |              |
                                                |              v
                                                |        demofly tts <name>
                                                |              |
                                                |              v
                                                |         audio/*.wav
                                                |              |
                                                v              v
                                          demofly generate <name>
                                                |
                                                v
                                          recordings/final.mp4
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
| `transcript.md` | `demofly/<name>/transcript.md` | Narration transcript with TTS tags and actual durations derived from timing.json. |

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

The proposal defines the **story** being told, not just a list of features to show.
Every proposal must start with the audience's pain point, not the product name.
Structure the demo as a narrative with rising action, not a feature walkthrough.

```markdown
# Demo Proposal: [Demo Name]

**Product:** [Product name]
**Target Duration:** [e.g. 90 seconds]
**Audience:** [Who is watching? What do they care about?]

## Narrative Arc

### Hook (first 5-10s)
[How does the demo grab attention? A question, a pain point, a surprising claim.
NEVER open with the product name or a definition. Open with the viewer's problem.]

### Problem (10-25s)
[What frustration or inefficiency exists today? What's the "before" world?
Don't just list pain points — paint a vivid picture that makes the viewer
wince in recognition. Use specific, embarrassing details. See "Show, Don't
Tell the Problem" in the Narration Style Guide.]

### Solution / Rising Action (25-60s)
[Show the product working. Build toward the key feature. Each scene should
raise the stakes — from simple to impressive.]

### Hero Moment (the climax — mark with ⭐)
[The single most impressive moment. The feature that makes viewers think
"I want this." This scene gets extra pacing, emotional weight, and polish.
Identify it explicitly — every demo has one.]

### Payoff / Close (final 10s)
[Quick, confident wrap. Specific to this demo — not generic. Quantify
the value if possible ("5 minutes vs 6 hours"). End with a call to action.]

## Scenes

### Scene 1: [Title] [target: Xs]
[2-3 sentence description. What happens AND what the viewer feels/learns.
Include the magic moment — what micro-interaction delights in this scene?]

### Scene 2: [Title] [target: Xs]
[2-3 sentence description. Identify the magic moment for this scene.]

### Scene N: [Title] ⭐ HERO [target: Xs]
[This is the hero scene — the "wow" moment. It gets longer duration,
slower pacing in the Playwright test, and the most emotionally resonant
narration. Mark exactly one scene as the hero.]

[... additional scenes]

## Demo Data Requirements
- [Any test data, accounts, or preconditions needed]
- [API mocks or feature flags to enable]

## Notes
- [Any assumptions or open questions for the user]
```

#### Hero Scene Guidance

Every demo should have exactly **one hero scene** — the moment that makes viewers
want the product. Mark it with ⭐ HERO in the scene heading.

The hero scene gets special treatment throughout the pipeline:
- **In the proposal:** Identified and described with extra detail
- **In the script:** Longer pauses before and after, more narration breathing room
- **In demo.spec.ts:** Deliberately slower pacing — add extra `waitForTimeout` calls
  so the viewer can absorb what's happening
- **In the transcript:** Highest-energy emotion tags, strategic pauses before the
  reveal, silence after the impressive moment lands

Examples of hero scenes:
- **DemoFly demoing itself:** The generation progress view — watching scenes appear
  in real-time (recording → narrating → complete)
- **A project management app:** AI auto-generating a full task breakdown from a
  one-line description
- **An analytics dashboard:** A complex query returning results in under a second
- **A design tool:** One-click export producing a pixel-perfect deliverable

#### Magic Moments in Non-Hero Scenes

The hero scene gets the biggest wow — but **every scene should include at least one
magic moment**: a micro-interaction that delights or surprises the viewer. Without
these, mid-demo scenes become the "middle section sag" where viewers mentally check out.

A magic moment is NOT:
- Clicking a navigation link
- Filling a form field
- Viewing a list or layout

A magic moment IS:
- Clicking "AI Enhance ✨" and watching a transcript rewrite itself in real-time
- Hovering a voice preview and hearing a 2-second sample
- Toggling a switch and seeing the entire UI theme change instantly
- Dragging a scene card and watching the timeline reorder with animation

**For storyboard/editor scenes specifically:** Don't just show the layout. Show a
power feature in action — AI transcript enhancement, voice swap preview, drag-to-reorder,
or instant regeneration. The viewer should see something that makes them think
"oh, that's clever" even in the middle of the demo.

**Proposal checklist addition:** When writing scene descriptions, verify each scene
has at least one moment tagged as a magic moment. If a scene is purely navigational
(arriving at a page, viewing a list), either add an interaction that delights or
merge it into an adjacent scene.

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

**Extraction script** — [extract-timing.js](extract-timing.js) is the ONLY supported way
to produce timing.json. Do not write timing.json manually. Run it after recording:

```bash
node <path-to-extract-timing.js> output.log demofly/<name>/recordings/timing.json
```

The script parses all `DEMOFLY|` lines, groups markers by scene (`start` → `end`),
and writes a camelCase `TimingData` JSON file. It creates the output directory if needed
and logs a summary to stderr.

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
4. Extract timing data with [extract-timing.js](extract-timing.js): `node extract-timing.js output.log demofly/<name>/recordings/timing.json`
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
   Mark the hero scene with `⭐ HERO`: `## Scene N: Title ⭐ HERO [target: Xs]`
4. Target duration is guidance, not a hard limit.
5. Every scene must have at least one beat.
6. Beats within a scene are ordered by execution sequence.
7. **Multi-beat spanning** — When 2-3 beats form a natural narration flow,
   use a range heading: `### {scene}.{start}–{scene}.{end} — {label} [spanning: {first-marker} → {last-marker}]`.
   The narration reads as one flowing sentence with sync points aligning
   key phrases to their on-screen actions. This avoids choppy sentence-per-beat patterns.

### Narration Style Guide

Good demo narration tells a story. Bad demo narration reads the screen aloud. The
difference between a forgettable demo and a compelling one is almost entirely in the
narration — the visuals show *what*; the narration explains *why it matters*.

#### The Core Principle: Narrate the Invisible

The viewer can already see what's happening on screen. Your narration must add what
the visuals can't show: the problem being solved, the time being saved, the
frustration being eliminated, the "why" behind each action. If you muted the
narration and the demo lost nothing, the narration was worthless.

**The Mute Test:** Read your narration without watching the video. If it's not
interesting as standalone audio — if it doesn't tell a micro-story — rewrite it.

#### Before/After Examples

**Mirror narration (BAD) → Value narration (GOOD):**

| ❌ Mirror (describes the screen) | ✅ Value (adds context) |
|---|---|
| "Click the New Project button." | "A new project starts with three fields — name, deadline, lead. That's it." |
| "Type a description in the text field." | "Tell it what you need in plain English. No templates, no configuration files." |
| "The dashboard shows your recent projects." | "Everything you're working on, at a glance. No digging through folders." |
| "Click Generate to start the process." | "One click. Watch what happens next." |
| "The loading spinner indicates processing." | *(silence — let the viewer watch it work)* |
| "As you can see, the results have appeared." | "Three seconds. What used to take an hour." |
| "That's ProductName — simple and powerful." | "From idea to published demo in under five minutes. Try it yourself." |

#### Narration Anti-Patterns

Avoid these patterns — they are the hallmarks of robotic, LLM-generated narration:

1. **Mirror narration** — Describing exactly what the viewer can see.
   - ❌ "I'm clicking the Sign Up button to sign up."
   - ✅ *(silence during click)* → "Account created. No email verification, no waiting."

2. **Feature dumping** — Product-speak that sounds like marketing copy.
   - ❌ "This feature allows you to seamlessly collaborate with your team in real-time."
   - ✅ "Your whole team sees changes live. No refresh needed."

3. **Hedging and filler** — Words that add length without meaning.
   - ❌ "You can easily and simply just click here to quickly..."
   - ✅ "Click. Done." (Let the speed prove "easy" — don't say it.)

4. **Captain Obvious** — Narrating things the viewer figured out 2 seconds ago.
   - ❌ "As you can see, the page has loaded and we are now on the dashboard."
   - ✅ *(skip — move to the next meaningful action)*

5. **Cliché closers** — Every demo ever ends this way. Don't.
   - ❌ "That's [ProductName] — fast, simple, and powerful."
   - ✅ "From zero to a published demo in four minutes. Your first one's free."

6. **Permission narration** — Asking the viewer's permission to proceed.
   - ❌ "Now let's go ahead and take a look at the settings page."
   - ✅ "Settings." *(navigate)* "Three toggles. No docs required."

#### Show, Don't Tell the Problem

The problem section is where you earn the viewer's attention. Listing pain points
is not enough — you need to make the viewer *wince in recognition*.

**Clinical (weak):**
> "Screen recording. Retakes. Editing audio in a timeline. Hours — for two minutes of video."

This lists the problem accurately but doesn't make the viewer *feel* it.

**Vivid (strong):**
> "You know the drill. Hit record, talk for two minutes, realize you said 'um' fourteen times. Start over. Get it right, then notice your cursor was covering the button. Start over. Sync the audio, export, re-export because the resolution was wrong..."

This makes the viewer relive their own experience. They're nodding and cringing
before you even show the product.

**How to write vivid problem framing:**
1. **Use second person** — "You know the drill" puts the viewer in the story
2. **Include specific, embarrassing details** — saying "um," cursor in the wrong place, wrong export settings. These are recognition triggers.
3. **Use escalation** — each detail should be slightly more frustrating than the last
4. **End with an implied "there has to be a better way"** — don't say it, let the viewer think it
5. **Keep it under 10 seconds** — vivid doesn't mean long. A tight 8-second problem section that makes the viewer wince beats a 15-second recitation of bullet points.

| ❌ Clinical (lists the problem) | ✅ Vivid (makes you feel it) |
|---|---|
| "Manual testing is slow and error-prone." | "You just pushed to staging. Now you're clicking through forty pages, checking the same buttons you checked yesterday, wondering if you missed something." |
| "Documentation gets outdated quickly." | "Your docs say 'click Settings.' The button was renamed to 'Preferences' three sprints ago. Nobody updated the screenshots." |
| "Demo creation requires multiple tools." | "Screen recorder. Audio editor. Video editor. Subtitle tool. Four apps, two hours, and it still looks like a screencast from 2015." |

#### Opening Patterns That Work

The first 5 seconds determine if someone keeps watching. Never open with the product
name or a definition. Open with the *audience's problem*:

- **Pain-point question:** "How long does it take your team to make a product demo?"
- **Surprising contrast:** "Most product demos take 6 hours. This one took 5 minutes."
- **Bold claim:** "What if your next demo recorded itself?"
- **Story start:** "Last Tuesday, a developer needed a demo for a board meeting. She had 20 minutes."

#### Pacing and Rhythm

- **Vary sentence length.** Short sentences punch. Longer sentences flow and give the viewer time to absorb complex actions. Mix both.
- **Use silence strategically.** After something impressive happens, *don't narrate it* — let the viewer sit with it. A 2-second pause after a fast result says "that was fast" better than any words.
- **Build to peaks.** Start calm and conversational. Accelerate through mechanical steps (form fills, navigation). Slow down and add weight for the "wow" moment. End with a quick, confident close.
- **Front-load value.** Each sentence should lead with the benefit or result, not the action. "Three seconds flat" before "to generate the whole thing."

#### Pacing Playbook — Specific Timing Guidance

Beyond general rhythm, these specific timing recommendations ensure narration breathes
properly and dramatic moments land:

| Situation | Recommended Silence | Why |
|-----------|-------------------|-----|
| After a rhetorical question | 1.5–2.0s | Let the viewer answer in their head before you continue |
| Before the hero reveal | 2–3s of pure silence | Build anticipation — the viewer should be leaning in |
| After the hero payoff line | 1–2s | Let the moment breathe. Don't rush to the next thing. |
| Between dense narration blocks | ≥1s pause or a silent beat | Prevents cognitive overload — the viewer needs processing time |
| At scene transitions | ≥1s | Clean mental reset. The viewer orients to the new screen. |
| After a surprising visual change | 1–1.5s | Let the viewer register what just happened on screen |

**Back-to-back narration cap:** No more than **3 consecutive narrated beats** without
either a silent beat or a pause of ≥1.0s within a beat. Dense narration without breaks
makes the viewer tune out — the words become background noise.

**Fill ratio targets by beat type:**
- **Hook/question beats:** 50–60% fill (leave room for the question to land)
- **Problem/story beats:** 60–75% fill (vivid storytelling needs words)
- **Action/walkthrough beats:** 30–50% fill (let the UI speak)
- **Hero setup/payoff beats:** 40–60% fill (breathing room around the wow)
- **Silent beats:** 0% fill (intentional — viewer watches)

#### Quantified Claims Must Be Supportable

When narration makes specific claims ("under five minutes," "three seconds," "ten
tasks"), those claims must be defensible from the actual demo workflow:

- **"Under five minutes"** — Only use if the demo workflow (URL → generated video)
  actually completes in under five minutes. If generation takes 8 minutes, say
  "minutes, not hours" instead.
- **"While you were watching this demo, DemoFly made another one"** — Only use if
  the generation time is genuinely shorter than the demo video length. If not,
  soften to "was already working on another one."
- **Counted items ("ten tasks," "five scenes")** — Must match what's visible on
  screen during the demo.

**Rule:** If a claim would make a skeptical Hacker News commenter call you out,
rephrase it. Credibility is worth more than a punchy line.

#### Multi-Beat Narration Flows

Narration doesn't have to be chopped into one sentence per beat. When 2-3 beats
form a natural flow (like filling a form), write a single flowing paragraph that
spans them. Use sync points to indicate when key phrases align with actions:

```markdown
### 2.1–2.3 — Create Flow [spanning: scene-2:click:new-btn → scene-2:type-end:name]

| Words | Action |
|-------|--------|
| "Name it," | Type project name |
| "set a deadline," | Click date picker, select date |
| "pick a lead — and you're building." | Select team lead, click Create |
```

The narration reads as one fluid sentence, but sync points align key phrases with
their corresponding on-screen actions. This avoids the choppy "sentence fragment
per beat" problem.

#### Narration Quality Checklist

Before finalizing any transcript, verify:

- [ ] **Hook test:** Does the opening grab attention in under 5 seconds? (No product name or definition as the first words.)
- [ ] **Mute test:** Is the narration interesting to *listen to* without the video?
- [ ] **Value test:** Does every sentence add context beyond what's visible on screen?
- [ ] **Wow test:** Is there at least one moment with dramatic pacing — a pause before a reveal, silence after something impressive?
- [ ] **Anti-pattern test:** Zero instances of mirror narration, filler phrases, or cliché closers?
- [ ] **Closing test:** Is the last sentence specific to this product and this demo (not a generic "that's [X]")?
- [ ] **Flow test:** Does the narration feel like one continuous story, not a list of disconnected observations?
- [ ] **Hero test:** Does the most impressive feature get noticeably more attention — slower pacing, emotional weight, breathing room?
- [ ] **Problem vividness test:** Does the problem section make the viewer *feel* frustration, not just understand it? (See "Show, Don't Tell the Problem")
- [ ] **Magic moment test:** Does every non-hero scene include at least one micro-wow interaction?
- [ ] **Pacing test:** No more than 3 consecutive narrated beats without a silent beat or ≥1s pause. Questions get 1.5-2s silence after.
- [ ] **Claims test:** Every quantified claim ("five minutes," "ten tasks") is supportable by the actual workflow.

### Complete Example

Notice how this example uses the narrative arc (hook → problem → solution → hero → payoff),
multi-beat spanning, a hero scene, value narration instead of mirror narration, and
strategic silence:

```markdown
# Script: TaskFlow Demo

**Product:** TaskFlow
**Target duration:** 90s
**Scenes:** 4

---

## Scene 1: The Problem [target: 15s]

### 1.1 — Hook  → `scene-1:start`

| Words | Action |
|-------|--------|
| "How long does it take to plan a new project at your company?" | Navigate to dashboard; page loads |
| "A day? A week of back-and-forth emails?" | *(screen static — dashboard visible)* |

### 1.2 — Dashboard Glance  → `scene-1:hover:active-projects`

| Words | Action |
|-------|--------|
| *(silence — let viewer take in the dashboard)* | Hover "Active Projects" card, then "Team Availability" panel |

### 1.3 — Transition  → `scene-1:click:new-project-btn`

| Words | Action |
|-------|--------|
| "Watch this." | Click "+ New Project" button |

---

## Scene 2: Three Fields and Done [target: 25s]

### 2.1 — Open Form  → `scene-2:click:new-project-btn`

| Words | Action |
|-------|--------|
| *(silence — modal opens)* | Click "+ New Project" button; wait for modal |

### 2.2–2.3 — Fill and Submit [spanning: scene-2:type-start:project-name → scene-2:click:create-btn]

| Words | Action |
|-------|--------|
| "Name it," | Type "Q1 Marketing Campaign" in name field |
| "deadline," | Click date picker, select March 15 |
| "team lead — done." | Select "Sarah Chen" from dropdown, click "Create Project" |
| *(silence — viewer watches the instant redirect)* | Wait for redirect to project page |

---

## Scene 3: The AI Moment ⭐ HERO [target: 30s]

### 3.1 — Setup  → `scene-3:click:suggest-btn`

| Words | Action |
|-------|--------|
| "Now here's the part that changes everything." | Click "AI Suggest Tasks" button |

### 3.2 — The Reveal  → `scene-3:wait-start:ai-suggestions`

| Words | Action |
|-------|--------|
| *(silence — let the viewer watch AI work)* | Spinner visible; wait for suggestions to appear |

### 3.3 — Impact  → `scene-3:wait-end:ai-suggestions`

| Words | Action |
|-------|--------|
| "Ten tasks. Time estimates based on your team's actual history. Five seconds." | Hover first task, then second task to show time estimates |

### 3.4 — Accept  → `scene-3:click:accept-all-btn`

| Words | Action |
|-------|--------|
| *(silence — one click, tasks fill the board)* | Click "Accept All"; wait for task list to update |

---

## Scene 4: The Payoff [target: 10s]

### 4.1 — Return  → `scene-4:navigate:dashboard`

| Words | Action |
|-------|--------|
| *(silence)* | Navigate to dashboard |

### 4.2 — Close  → `scene-4:pause:final`

| Words | Action |
|-------|--------|
| "From nothing to a fully planned project. Ninety seconds. Try it yourself." | *(screen static — dashboard showing new project)* |
```

**What makes this example better than a feature walkthrough:**
- Opens with a pain-point question, not the product name
- Scene 2 uses multi-beat spanning for a flowing "name it, deadline, team lead — done" rhythm
- Scene 3 (⭐ HERO) uses strategic silence during AI generation — the *viewer watches it work*
- The narration after the reveal ("Ten tasks... Five seconds.") focuses on the *result*, not the action
- The closer is specific and quantified ("Ninety seconds"), not a cliché
- Silent beats let impressive moments speak for themselves

---

## 7. Transcript, TTS, and Final Assembly

The cardinal rule: **record first, narrate second.** Video timing is variable and
unpredictable. Network latency, animation durations, and page load times all
affect how long each scene actually takes. Narration must adapt to the video, not
the other way around.

### Workflow

1. Run the Playwright recording and capture console output.
2. Extract timing.json from DEMOFLY markers (Section 2).
3. Generate transcript.md using actual scene durations from timing.json.
4. Run `demofly tts <name>` to generate per-scene audio files.
5. Run `demofly generate <name>` to assemble the final video.

TTS and final assembly are **deterministic CLI operations** — the agent delegates
them to the `demofly` CLI rather than running ffmpeg or TTS inline. This keeps
the agent focused on creative work (transcript writing, timing adjustments) while
the CLI handles mechanical transformations.

### transcript.md Format

**CRITICAL: All narration text MUST be wrapped in `<narration>` tags.** The TTS engine
only reads text inside these tags. Everything outside (headers, word budgets, metadata,
comments) is completely ignored. This prevents metadata from leaking into audio output.

```markdown
# Demo Transcript: [Demo Name]

Generated from timing.json after recording on [date].

## Scene 1: Dashboard Overview

### Beat 1.1 — Introduction [at 0ms, window: 5.2s]
**Word budget**: 8 words | **Hard cap**: 13 words

<narration>[warmly] TaskFlow gives your team a single place to track every project.</narration>

### Beat 1.2 — Dashboard Tour [at 5200ms, window: 4.6s]
**Word budget**: 7 words | **Hard cap**: 11 words

<narration>Here's the dashboard — [pause: 0.3s] active projects, recent activity, team availability at a glance.</narration>

### Beat 1.3 — Transition [at 9800ms, window: 2.6s]
**Word budget**: 4 words | **Hard cap**: 6 words

<narration>Let's create something new.</narration>

## Scene 2: Create a Project

### Beat 2.1 — Open Form [at 12400ms, window: 3.8s]

_(Beat 2.1 silent — modal opens, no narration)_

### Beat 2.2 — Fill Form [at 16200ms, window: 8.1s]
**Word budget**: 12 words | **Hard cap**: 20 words

<narration>Give it a name, [pause: 0.3s] set a deadline, [pause: 0.3s] and assign a team lead.</narration>

### Beat 2.3 — Submit [at 24300ms, window: 3.2s]
**Word budget**: 5 words | **Hard cap**: 8 words

<narration>[casual] That's it — you're ready to go.</narration>

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

Tags are compatible with the Kokoro TTS engine used by `demofly tts`.

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

### TTS Generation via CLI

After generating transcript.md, delegate TTS audio synthesis to the `demofly tts`
CLI command:

```bash
demofly tts <name>
```

This reads `demofly/<name>/transcript.md`, parses per-scene narration text
(stripping TTS tags), synthesizes audio using Kokoro TTS, and writes WAV files
to `demofly/<name>/audio/scene-1.wav`, `scene-2.wav`, etc.

Options:
- `--voice <name>` — TTS voice (default: `af_heart`). Available: `af_heart`,
  `af_bella`, `af_nicole`, `af_nova`, `af_sarah`, `am_adam`, `am_michael`.
- `--speed <multiplier>` — Speech rate (default: `1.0`).

The CLI requires Node 22+. If the default node version is older, use nvm:
```bash
source ~/.nvm/nvm.sh && nvm use 22 > /dev/null 2>&1 && demofly tts <name>
```

### Final Assembly via CLI

After TTS (or directly after recording if no narration), delegate final video
assembly to the `demofly generate` CLI command:

```bash
demofly generate <name>
```

This reads existing artifacts from disk:
- `demofly/<name>/recordings/video.webm` — the Playwright recording
- `demofly/<name>/recordings/timing.json` — timing marker data
- `demofly/<name>/audio/*.wav` — TTS audio files (optional)

And produces `demofly/<name>/recordings/final.mp4`:
- If audio files exist: stitches audio onto video using ffmpeg with
  timing-based delays (adelay filter, per-scene alignment).
- If no audio: converts webm to mp4 (or copies as-is if ffmpeg unavailable).

The agent does NOT run ffmpeg directly — `demofly generate` handles all
assembly logic internally.

### Final Quality Checks

After assembly, remind the user to verify:
1. **Watch the final video** to check visual quality and audio sync.
2. **Audio timing** — narration should align with on-screen actions.
3. **Volume consistency** across scenes.
4. **No audio overlap** between beats.

The agent cannot see video content — it can only confirm the CLI reported
success and check file sizes.

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
- **`createTempDir(demoName)`** — Creates an OS-agnostic transient temp directory under `os.tmpdir()`. Returns the absolute path. See Section 9.
- **`createSessionTmpDir(demoDir)`** — Creates (or ensures) a `.tmp/` subdirectory inside the demo folder for session-scoped intermediate artifacts. See Section 9.

### Customization

The template is a copy, not a shared import. If a specific demo needs different timing
constants or cursor styling, modify the local copy. The template provides consistent
defaults across demos.

---

## 9. Artifact Directory Strategy

Demo artifacts must **never pollute the user's repository root**. All files generated
during the demo lifecycle go into one of three locations, based on their lifecycle:

### Three-Tier Directory Strategy

| Tier | Location | Contents | Lifecycle |
|------|----------|----------|-----------|
| **Transient** | OS temp dir (`os.tmpdir()`) | Exploration screenshots, debug captures, error screenshots, intermediate processing files | Disposable — OS cleans up on reboot |
| **Session** | `demofly/<name>/.tmp/` | Draft scripts, planning screenshots, debug logs, intermediate versions | Persists within a session, gitignored |
| **Final** | `demofly/<name>/` | proposal.md, script.md, demo.spec.ts, recordings/, audio/, transcript.md | Permanent pipeline artifacts |

### OS-Agnostic Temp Directories

**Never hardcode `/tmp`.** It does not exist on Windows.

Use the helpers from `plugins/demofly/templates/helpers.ts`:

```typescript
import { createTempDir, createSessionTmpDir } from './helpers';

// Transient: OS temp dir (auto-cleaned, no repo footprint)
const tmpDir = await createTempDir('my-demo');
// → e.g. /tmp/demofly-my-demo-abc123/ (Linux/macOS)
// → e.g. C:\Users\user\AppData\Local\Temp\demofly-my-demo-abc123 (Windows)

// Session: demo-specific .tmp dir (gitignored, persists in session)
const sessionDir = await createSessionTmpDir('demofly/my-demo');
// → demofly/my-demo/.tmp/
```

Or use the standalone script (no TypeScript compilation needed):

```bash
# Transient temp dir
TMPDIR=$(node scripts/create-temp-dir.js my-demo --type transient)

# Session temp dir
SESSDIR=$(node scripts/create-temp-dir.js my-demo --type session)
```

Both approaches use `os.tmpdir()` (Node.js built-in) under the hood, which resolves
to the correct platform-specific path on Linux, macOS, and Windows.

### Where Each Artifact Type Goes

| Artifact | Tier | Location |
|----------|------|----------|
| Exploration screenshots (UI discovery) | Transient | `os.tmpdir()/demofly-<name>-*/` |
| Debug captures / error screenshots | Transient | `os.tmpdir()/demofly-<name>-*/` |
| Intermediate processing files | Transient | `os.tmpdir()/demofly-<name>-*/` |
| Draft scripts, intermediate versions | Session | `demofly/<name>/.tmp/` |
| Planning screenshots for script design | Session | `demofly/<name>/.tmp/` |
| Recording session logs | Session | `demofly/<name>/.tmp/` |
| proposal.md, script.md, demo.spec.ts | Final | `demofly/<name>/` |
| timing.json, video.webm, final.mp4 | Final | `demofly/<name>/recordings/` |
| TTS audio files | Final | `demofly/<name>/audio/` |
| transcript.md | Final | `demofly/<name>/` |

### .gitignore

Add this pattern to the project's `.gitignore` (or recommend it to the user):

```
# DemoFly session artifacts
demofly/**/.tmp/
```

The transient tier needs no gitignore entry — it lives outside the repo entirely.
