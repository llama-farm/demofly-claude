# Demofly Create — Reference

Detailed specifications for artifact formats, timing markers, interaction patterns,
Playwright recording, sub-agent delegation, narration style, personas, velocity
profiles, and assembly. The skill reads this file when generating specific artifacts.

Read the relevant section before generating any artifact. When in doubt, re-read
rather than guessing.

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
| `proposal.md` | `demofly/<name>/proposal.md` | Scene outline: narrative arc, scenes with descriptions, demo data, target durations. User approval checkpoint. |
| `script.md` | `demofly/<name>/script.md` | Master document: beat map, per-scene narration text, interaction sequence, sync notes mapping narration to marker IDs. |
| `demo.spec.ts` | `demofly/<name>/demo.spec.ts` | Executable Playwright test with timing markers, human-like interactions, fake cursor. |
| `playwright.config.ts` | `demofly/<name>/playwright.config.ts` | Recording configuration. |
| `timing.json` | `demofly/<name>/recordings/timing.json` | Scene and action timestamps extracted from DEMOFLY markers in console output. |
| `transcript.md` | `demofly/<name>/transcript.md` | Narration transcript with TTS tags and actual durations derived from timing.json. |

---

## 2. Artifact Format Templates

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
Tell the Problem" in §7.]

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
- **In demo.spec.ts:** Deliberately slower pacing (Hero velocity profile)
- **In the transcript:** Highest-energy emotion tags, strategic pauses before the reveal, silence after the impressive moment lands

#### Magic Moments in Non-Hero Scenes

The hero scene gets the biggest wow — but **every scene should include at least one
magic moment**: a micro-interaction that delights or surprises the viewer. Without
these, mid-demo scenes become the "middle section sag" where viewers mentally check out.

A magic moment is NOT:
- Clicking a navigation link
- Filling a form field
- Viewing a list or layout

A magic moment IS:
- Clicking "AI Enhance" and watching a transcript rewrite itself in real-time
- Hovering a voice preview and hearing a 2-second sample
- Toggling a switch and seeing the entire UI theme change instantly
- Dragging a scene card and watching the timeline reorder with animation

### script.md Format — Beat-Centric

The script is the master document that connects narration to Playwright actions.
It uses **beats** — the atomic unit that pairs a narration fragment with its
ordered actions and a timing marker.

#### Beat Heading Format

```
### {scene}.{beat} — {label}  → `{marker-id}`
```

Example: `### 2.3 — Submit  → `scene-2:click:create-btn``

The colon-delimited IDs in beat headings (e.g. `scene-2:click:create-btn`) are
compact shorthand for the three arguments passed to `mark(scene, action, target)`.
At runtime, `mark()` emits pipe-delimited console output
(`DEMOFLY|scene-2|click|create-btn|1234`). Colons are for human-readable headings,
pipes are for machine-parseable logs.

#### Beat Body Format

A markdown table with `Words` and `Action` columns:

```markdown
| Words | Action |
|-------|--------|
| "Let's create a new project." | Click "+ New Project" button |
| *(wait)* | Wait for modal to appear |
```

**Table rules:**
1. Each row pairs a narration phrase with the action happening during/alongside it.
2. **Multi-action continuation** — When a single phrase maps to multiple sequential actions, use continuation rows with an empty Words cell.
3. **Silent beats** — No narration. Use `*(silence — description)*` in the Words cell.
4. **Static beats** — Narration over a still screen. Words are present but Action is `*(screen static)*`.
5. Rows are ordered chronologically — top to bottom is the execution order.

#### Format Rules

1. Beat IDs use `{scene}.{beat}` numbering (e.g., 1.1, 1.2, 2.1).
2. Every beat heading MUST include a marker ID after `→` that exists in demo.spec.ts.
3. Scene headings use `## Scene N: Title [target: Xs]`.
   Mark the hero scene with `⭐ HERO`: `## Scene N: Title ⭐ HERO [target: Xs]`
4. Target duration is guidance, not a hard limit.
5. Every scene must have at least one beat.
6. Beats within a scene are ordered by execution sequence.
7. **Multi-beat spanning** — When 2-3 beats form a natural narration flow, use a range heading:
   `### {scene}.{start}–{scene}.{end} — {label} [spanning: {first-marker} → {last-marker}]`

---

## 3. Timing Marker System

Timing markers are the bridge between recorded video and narration audio. Every
action in demo.spec.ts emits a console log with a structured prefix. After
recording, these logs are parsed into timing.json, which drives narration timing
and ffmpeg stitching.

### The Marker Helper

Place this at the top of every `demo.spec.ts`, before any test blocks:

```typescript
const t0 = Date.now();
const mark = (scene: string, action: string, target?: string) =>
  console.log(`DEMOFLY|${scene}|${action}|${target ?? ''}|${Date.now() - t0}`);
```

> **Preferred approach:** Copy the shared template (`plugins/demofly/templates/helpers.ts`)
> into the demo directory and use `import { createMarker } from './helpers'`.
> See §14.

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
| `navigate` | Page navigation or route change | After a navigation completes |
| `pause` | Deliberate viewer pause | Before a `waitForTimeout` that exists purely for pacing |

### Usage Pattern

Every interaction in demo.spec.ts must be bracketed by markers:

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

### timing.json Format

The resulting timing.json **must** use camelCase field names to match the CLI's
`TimingData` TypeScript interface.

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
        { "action": "type-end", "target": "project-name", "ms": 8200 }
      ]
    }
  ]
}
```

**The only correct field names are:**
- Top level: `totalDuration` (not `duration`, `total_duration_ms`, `totalDurationMs`)
- Scene: `sceneId` (not `id`, `scene_id`, `name`)
- Scene: `startMs` (not `start_ms`, `begin`, `from`, `start`)
- Scene: `endMs` (not `end_ms`, `finish`, `to`, `end`)
- Marker: `action`, `target`, `ms` (these three only)

**Extraction script** — `extract-timing.js` is the ONLY supported way to produce
timing.json. Do not write timing.json manually:

```bash
node plugins/demofly/skills/create/extract-timing.js output.log demofly/<name>/recordings/timing.json
```

---

## 4. Human-Like Interaction Patterns

Demos must look like a real person using the product. Robotic instant clicks and
fills break immersion.

### Typing

Never use `fill()`. Always use `pressSequentially()` with a per-key delay:

```typescript
await element.pressSequentially('Text to type', { delay: 35 });
```

- 35ms per keystroke (~28 chars/sec). Natural without being slow.
- Short values (under 10 chars): 40-50ms for a deliberate feel.
- Long paragraphs (over 100 chars): 25-30ms to avoid dragging.
- Adjust per velocity profile (see §9).

### Distance-Based Cursor Delay

Real users move a mouse physically. Calculate delay from element bounding boxes:

```typescript
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

### Fake DOM Cursor

Playwright operates headlessly with no visible mouse pointer. Inject a fake cursor
at the start of each test:

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

Notes:
- `position: fixed` stays visible during scrolling.
- `pointer-events: none` prevents intercepting clicks.
- Re-inject after any full page navigation (`page.goto()`) because the DOM resets.
- After SPA route changes the cursor persists.

### Natural Pauses

| Situation | Delay | Rationale |
|-----------|-------|-----------|
| After clicking a button | 300-500ms | Micro-pause before next action |
| After a page transition | 800-1200ms | Let viewer orient |
| After a result appears | 1500-2500ms | Viewer reads the result |
| Between scenes | 1000-1500ms | Clean separation |
| After filling a form field | 400-600ms | Mimics glancing at next field |
| After hovering on a tooltip | 800-1200ms | Viewer reads hover content |

### Field Interaction Timeouts

After typing, pause proportionally to text length:

```typescript
const text = 'A description of the project';
await field.pressSequentially(text, { delay: 35 });
await page.waitForTimeout(text.length * 50 + 500);
```

### Scroll Behavior

```typescript
mark('scene-3', 'scroll', 'task-list');
await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
await page.waitForTimeout(600);
```

Always use `behavior: 'smooth'` for visible scrolling.

---

## 5. Playwright Recording Configuration

### Complete Configuration Template

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 600_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1280, height: 800 },
    video: 'on',
    launchOptions: {
      headless: true,
      slowMo: 50,
    },
  },
  reporter: [['list']],
});
```

**Notes:**
- `timeout: 600_000` — Demos can run several minutes.
- `viewport: 1280x800` — Standard 16:10 demo resolution.
- `video: 'on'` — Records video for every test run.
- `headless: true` — **All browser launches MUST be headless.**
- `slowMo: 50` — Adds 50ms between every Playwright action.
- `baseURL` — Update to match the URL in `context.md`.

### Bash Tool Timeout

When executing from the Bash tool, always set `timeout: 600000` (milliseconds).

### Post-Recording File Handling

1. Find the video file: `test-results/*/video.webm`
2. Create recordings dir: `mkdir -p demofly/<name>/recordings`
3. Move video: `mv test-results/*/video.webm demofly/<name>/recordings/video.webm`
4. Extract timing: `node plugins/demofly/skills/create/extract-timing.js output.log demofly/<name>/recordings/timing.json`
5. Optionally convert: `ffmpeg -i recordings/video.webm -c:v libx264 -crf 23 recordings/video.mp4`

---

## 6. Sub-Agent Delegation Details

### Product Exploration (Parallel)

Launch both agents concurrently via multiple Task tool calls in a single message.

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

### Synthesizing Results

Combine static findings (stack, routes) with dynamic findings (page content,
interactive elements). Where findings conflict, note the discrepancy in the
UI Quirks section of context.md.

### Debugging Delegation

```
Prompt: "This Playwright test failed. Here's the error:
[paste error output]

Here's the relevant section of demo.spec.ts:
[paste failing code section]

This scene should: [describe from script.md]

Diagnose the failure and provide specific code fixes. Common causes:
- Selector changed (element text or role differs)
- Timing issue (element not yet visible, animation not finished)
- Navigation issue (URL pattern changed, redirect added)
- Data issue (expected data not present)"
```

### Debug-Fix Cycle Limits

1. Apply the sub-agent's suggested fixes.
2. Re-run the recording.
3. If it fails again, delegate again with the new error.
4. Maximum 3 debug-fix cycles. After 3 failures, stop and ask the user.

### When to Use Sub-Agents vs. Doing It Yourself

| Task | Approach |
|------|----------|
| Initial product exploration | Parallel sub-agents (always) |
| Writing proposal.md, script.md | Do this directly |
| Writing demo.spec.ts | Do this directly |
| Debugging test failures | Sub-agent delegation |
| Quick URL reachability check | Inline check (no sub-agent) |
| Exploring a complex page | Sub-agent with Playwright MCP |

---

## 7. Narration Style Guide

Good demo narration tells a story. Bad demo narration reads the screen aloud.

### The Core Principle: Narrate the Invisible

The viewer can already see what's happening on screen. Your narration must add what
the visuals can't show: the problem being solved, the time being saved, the
frustration being eliminated.

**The Mute Test:** Read your narration without watching the video. If it's not
interesting as standalone audio, rewrite it.

### Before/After Examples

| Mirror (BAD) | Value (GOOD) |
|---|---|
| "Click the New Project button." | "A new project starts with three fields — name, deadline, lead. That's it." |
| "Type a description in the text field." | "Tell it what you need in plain English. No templates, no configuration files." |
| "The dashboard shows your recent projects." | "Everything you're working on, at a glance. No digging through folders." |
| "Click Generate to start the process." | "One click. Watch what happens next." |
| "The loading spinner indicates processing." | *(silence — let the viewer watch it work)* |
| "As you can see, the results have appeared." | "Three seconds. What used to take an hour." |
| "That's ProductName — simple and powerful." | "From idea to published demo in under five minutes. Try it yourself." |

### Narration Anti-Patterns

1. **Mirror narration** — Describing exactly what the viewer can see.
   - ❌ "I'm clicking the Sign Up button to sign up."
   - ✅ *(silence during click)* → "Account created. No email verification, no waiting."

2. **Feature dumping** — Product-speak that sounds like marketing copy.
   - ❌ "This feature allows you to seamlessly collaborate with your team in real-time."
   - ✅ "Your whole team sees changes live. No refresh needed."

3. **Hedging and filler** — Words that add length without meaning.
   - ❌ "You can easily and simply just click here to quickly..."
   - ✅ "Click. Done."

4. **Captain Obvious** — Narrating things the viewer figured out 2 seconds ago.
   - ❌ "As you can see, the page has loaded and we are now on the dashboard."
   - ✅ *(skip — move to the next meaningful action)*

5. **Cliche closers** — Every demo ever ends this way.
   - ❌ "That's [ProductName] — fast, simple, and powerful."
   - ✅ "From zero to a published demo in four minutes. Your first one's free."

6. **Permission narration** — Asking the viewer's permission to proceed.
   - ❌ "Now let's go ahead and take a look at the settings page."
   - ✅ "Settings." *(navigate)* "Three toggles. No docs required."

### **No-Mirror Rule (Promoted)**

> **This is the single most important narration rule.** Never describe what the
> viewer can already see. If your narration could be replaced by a subtitle track
> of screen actions, it's worthless. Every sentence must add invisible context —
> the "why," the comparison to the old way, the time saved, the feeling.

### **70/30 Silence Target (Promoted)**

> **At least 30% of every scene should be silence.** Silence during a visual demo
> is not dead air — the viewer is watching the product work. Over-narration is the
> #1 killer of demo quality. When in doubt, cut words and add silence.

### Bridge Technique

Every narration beat connects the previous result to the next intent. This creates
flow — the viewer follows a single story rather than a sequence of disconnected
observations.

**Pattern:** `[Previous result] → [deictic bridge] → [next intent]`

**Deictic expressions that create bridges:**
- "Now that we've [result], let's [intent]..."
- "With that in place..."
- "That gives us [result] — which means we can..."
- "And because [previous], [next] is just..."
- "So now..."

**Examples:**
| Without Bridge (choppy) | With Bridge (flowing) |
|---|---|
| "The project is created. Let's add tasks." | "With our project in place, let's see what AI can do with the task list." |
| "The form is submitted. The results appear." | "That's all it needs. Watch what happens next." |
| "We selected the template. Now we customize." | "Now that we have a starting point, a few tweaks make it ours." |

### Contextual Glance-Backs

Scenes are not islands. Each scene's opening must reference what came before,
creating narrative continuity:

- Scene 2 opening: "With our project created..."
- Scene 3 opening: "Now that we have the basic structure..."
- Scene 4 opening: "Everything we just built..."
- Final scene: "From [where we started] to [where we are now]..."

**Rule:** The first narrated beat of every scene (except Scene 1) must contain
a backward reference. This can be a single word ("Now...") or a clause
("With that foundation..."), but it must exist.

### Show, Don't Tell the Problem

The problem section earns the viewer's attention. Listing pain points isn't enough.

**Clinical (weak):**
> "Screen recording. Retakes. Editing audio in a timeline. Hours — for two minutes of video."

**Vivid (strong):**
> "You know the drill. Hit record, talk for two minutes, realize you said 'um' fourteen times. Start over. Get it right, then notice your cursor was covering the button. Start over. Sync the audio, export, re-export because the resolution was wrong..."

**How to write vivid problem framing:**
1. **Use second person** — "You know the drill"
2. **Include specific, embarrassing details** — recognition triggers
3. **Use escalation** — each detail more frustrating than the last
4. **End with implied "there has to be a better way"** — don't say it
5. **Keep it under 10 seconds** — vivid doesn't mean long

### Opening Patterns That Work

Never open with the product name. Open with the audience's problem:

- **Pain-point question:** "How long does it take your team to make a product demo?"
- **Surprising contrast:** "Most product demos take 6 hours. This one took 5 minutes."
- **Bold claim:** "What if your next demo recorded itself?"
- **Story start:** "Last Tuesday, a developer needed a demo for a board meeting. She had 20 minutes."

### Pacing and Rhythm

- **Vary sentence length.** Short sentences punch. Longer sentences flow.
- **Use silence strategically.** After something impressive, don't narrate — let the viewer sit with it.
- **Build to peaks.** Start calm. Accelerate through mechanical steps. Slow down for the "wow." End quick and confident.
- **Front-load value.** Lead with the benefit, not the action.

### Pacing Playbook — Specific Timing

| Situation | Recommended Silence | Why |
|-----------|-------------------|-----|
| After a rhetorical question | 1.5-2.0s | Let the viewer answer in their head |
| Before the hero reveal | 2-3s pure silence | Build anticipation |
| After the hero payoff line | 1-2s | Let the moment breathe |
| Between dense narration blocks | ≥1s pause or silent beat | Prevent cognitive overload |
| At scene transitions | ≥1s | Clean mental reset |
| After a surprising visual change | 1-1.5s | Let the viewer register |

**Back-to-back narration cap:** No more than **3 consecutive narrated beats** without
a silent beat or ≥1.0s pause.

**Fill ratio targets by beat type:**
- Hook/question beats: 50-60% fill
- Problem/story beats: 60-75% fill
- Action/walkthrough beats: 30-50% fill
- Hero setup/payoff beats: 40-60% fill
- Silent beats: 0% fill

### Multi-Beat Narration Flows

When 2-3 beats form a natural flow, write a single flowing paragraph:

```markdown
### 2.1-2.3 — Create Flow [spanning: scene-2:click:new-btn → scene-2:type-end:name]

| Words | Action |
|-------|--------|
| "Name it," | Type project name |
| "set a deadline," | Click date picker, select date |
| "pick a lead — and you're building." | Select team lead, click Create |
```

### Quantified Claims Must Be Supportable

- **"Under five minutes"** — Only if the workflow actually completes in under five minutes.
- **Counted items** — Must match what's visible on screen.
- **Rule:** If a skeptical Hacker News commenter would call you out, rephrase.

### Narration Quality Checklist

Before finalizing any transcript, verify all 12:

- [ ] **Hook test:** Opening grabs attention in under 5 seconds? (No product name first.)
- [ ] **Mute test:** Narration interesting as standalone audio?
- [ ] **Value test:** Every sentence adds context beyond what's visible?
- [ ] **Wow test:** At least one moment with dramatic pacing?
- [ ] **Anti-pattern test:** Zero mirror narration, filler, or cliche closers?
- [ ] **Closing test:** Last sentence specific to this demo?
- [ ] **Flow test:** Narration feels like one continuous story?
- [ ] **Hero test:** Hero feature gets noticeably more attention?
- [ ] **Problem vividness test:** Problem section makes the viewer *feel* frustration?
- [ ] **Magic moment test:** Every non-hero scene has a micro-wow?
- [ ] **Pacing test:** No more than 3 consecutive narrated beats without silence?
- [ ] **Claims test:** Every quantified claim is supportable?

---

## 8. Persona Details

Per-persona constraints for narration generation and Playwright timing.

### Polished Keynote (Default)

- **Sentence structure:** Short declarative. Fragments for emphasis. No compound sentences over 15 words.
- **Vocabulary:** Zero jargon. No acronyms unless universally known (AI, URL). "You/your" pronoun.
- **TTS tags:** `[warmly]` for intro/outro, `[confidently]` for features, `[impressed]` for hero. Light pauses.
- **Silence ratio:** 35% — generous breathing room. Viewer watches the product.
- **Cursor speed:** Slow/smooth (40 steps in `moveCursor`). Deliberate, executive feel.
- **Lead-in:** 800ms — narrator speaks well before action begins.
- **Example tone:** "One click. Watch what happens next." / "Three seconds. What used to take an hour."

### Engineering Standup

- **Sentence structure:** Technical compound OK. "We shipped X, and here's how it works."
- **Vocabulary:** Jargon welcome (API, webhook, deploy). "We/our" pronoun. Casual contractions.
- **TTS tags:** `[casual]` baseline, `[matter-of-fact]` for technical, `[excited]` for hero. Minimal pauses.
- **Silence ratio:** 25% — more narration-dense, less breathing room.
- **Cursor speed:** Snappy/fast (15 steps). Engineer-efficient feel.
- **Lead-in:** 200ms — near-simultaneous narration and action.
- **Example tone:** "We wired up the AI endpoint last sprint — watch what it does to the task list."

### Hype Marketing

- **Sentence structure:** Fragments. Punchy.
- **Vocabulary:** Superlatives OK ("instantly," "effortlessly"). "You" pronoun. Action verbs.
- **TTS tags:** `[excited]` baseline, `[energetic]` for hero, `[impressed]` for reveals. Fast pacing.
- **Silence ratio:** 20% — high energy, minimal silence. Quick cuts between narration.
- **Cursor speed:** Dynamic/aggressive (10 steps). Fast, energetic.
- **Lead-in:** 0ms — narration and action simultaneous.
- **Example tone:** "Boom. Done. Your demo. Five minutes." / "Watch this. AI. Instant."

---

## 9. Velocity Profiles

Interaction velocity varies by emotional phase. These translate the beat map's
velocity column into concrete Playwright timing constants.

| Phase | Cursor Steps | Click Delay | Type Delay | Post-Action Pause | moveCursor Speed |
|-------|-------------|-------------|------------|------------------|-----------------|
| **Problem** (frustration, tension) | 15 | 600-800ms | 25ms | 300-500ms | `'fast'` |
| **Solution** (capability, relief) | 25 | 800-1200ms | 35ms | 500-800ms | `'smooth'` |
| **Hero** (awe, delight) | 40 | 1200-1800ms | 45ms | 1000-2000ms | `'smooth'` |
| **Payoff** (confidence, closure) | 25 | 800-1000ms | 35ms | 500-700ms | `'smooth'` |

### Applying Velocity in demo.spec.ts

```typescript
// Problem scene — fast, impatient pacing
mark('scene-1', 'click', 'dashboard-link');
await moveCursor(page, '#dashboard-link', 'fast');
await page.locator('#dashboard-link').click();
await page.waitForTimeout(400); // short post-action

// Hero scene — deliberate, slow pacing
mark('scene-3', 'click', 'ai-suggest-btn');
await moveCursor(page, '#ai-suggest-btn', 'smooth');
await page.waitForTimeout(300); // extra pre-click dwell
await page.locator('#ai-suggest-btn').click();
await page.waitForTimeout(1500); // long post-action for impact
```

---

## 10. Beat Map Format

The beat map is inserted at the top of `script.md`, before Scene 1. It maps each
scene to its emotional beat, UI actions summary, velocity profile, and silence
target.

```markdown
## Beat Map

| Scene | Emotional Beat | UI Actions (summary) | Velocity | Silence Target |
|-------|---------------|---------------------|----------|---------------|
| 1 | Tension / Problem | Navigate dashboard, hover pain points | Fast / impatient | 20% |
| 2 | Relief / Solution | Create form, fill fields, submit | Moderate / steady | 30% |
| 3 ⭐ | Awe / Hero | Trigger AI, watch results appear | Deliberate / slow | 40% |
| 4 | Confidence / Payoff | Return to dashboard, final state | Moderate | 35% |
```

**Rules:**
- Exactly one row per scene
- The ⭐ marker must appear on the hero scene
- Velocity must match a profile from §9
- Silence targets must respect the persona's ratio (§8) — these are per-scene overrides within the persona's global range

---

## 11. Narrative Lead-in Technique

Narration starts BEFORE the action it describes. The narrator feels like they're
"driving" the app — the voice anticipates what's about to happen, then the UI
responds.

### Timing

| Persona | Lead-in | Effect |
|---------|---------|--------|
| Polished Keynote | 800ms | Narrator speaks, then cursor moves. Visionary feel. |
| Engineering Standup | 200ms | Near-simultaneous. Authentic feel. |
| Hype Marketing | 0ms | Simultaneous narration and action. High energy. |

### Implementation in demo.spec.ts

The lead-in means the narration marker fires before the interaction marker:

```typescript
// For Polished Keynote (800ms lead-in):
mark('scene-2', 'narration', 'create-intro');  // narrator begins speaking here
await page.waitForTimeout(800);                  // lead-in gap
mark('scene-2', 'click', 'create-btn');         // action happens here
await page.locator('#create-btn').click();
```

For Engineering Standup, the gap is 200ms. For Hype Marketing, both markers fire
at the same point (no wait between them).

### In transcript.md

Account for lead-in when calculating beat timestamps. The narration `at` time
should be `action_ms - lead_in_ms`:

```markdown
### Beat 2.1 — Create Project [at 11600ms, window: 4.2s]
```

Where 11600ms = action marker at 12400ms - 800ms lead-in.

---

## 12. Complete Script Example (Annotated)

This example demonstrates the beat map, bridge technique, multi-beat spanning,
hero scene treatment, value narration, strategic silence, and contextual
glance-backs:

```markdown
# Script: TaskFlow Demo

**Product:** TaskFlow
**Target duration:** 90s
**Persona:** Polished Keynote
**Scenes:** 4

## Beat Map

| Scene | Emotional Beat | UI Actions (summary) | Velocity | Silence Target |
|-------|---------------|---------------------|----------|---------------|
| 1 | Tension / Hook | Navigate dashboard, hover cards | Fast | 25% |
| 2 | Relief / Solution | Create project form flow | Moderate | 30% |
| 3 ⭐ | Awe / Hero | AI task generation | Deliberate | 40% |
| 4 | Confidence / Payoff | Return to dashboard | Moderate | 35% |

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

### 2.2-2.3 — Fill and Submit [spanning: scene-2:type-start:project-name → scene-2:click:create-btn]

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
| *(silence — let the viewer watch AI work)* | Spinner visible; wait for suggestions |

### 3.3 — Impact  → `scene-3:wait-end:ai-suggestions`

| Words | Action |
|-------|--------|
| "Ten tasks. Time estimates based on your team's actual history. Five seconds." | Hover first task, then second to show estimates |

### 3.4 — Accept  → `scene-3:click:accept-all-btn`

| Words | Action |
|-------|--------|
| *(silence — one click, tasks fill the board)* | Click "Accept All"; wait for list update |

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

**What makes this work:**
- Beat map at top establishes velocity and silence targets per scene
- Opens with pain-point question, not product name
- Scene 2 uses multi-beat spanning for flowing rhythm
- Scene 2 opens with silence (glance-back is implicit in the modal opening from Scene 1's transition)
- Scene 3 (⭐ HERO) uses deliberate velocity + 40% silence target
- The narration after the reveal focuses on the *result*, not the action
- Closer is specific and quantified, not a cliche
- Silent beats let impressive moments speak for themselves

---

## 13. Transcript, TTS, and Final Assembly

### Record First, Narrate Second

Video timing is variable. Narration must adapt to the video, not the other way around.

### Workflow

1. Run the Playwright recording and capture console output.
2. Extract timing.json from DEMOFLY markers (§3).
3. Generate transcript.md using actual scene durations from timing.json.
4. Run `demofly tts <name>` to generate per-scene audio files.
5. Run `demofly generate <name>` to assemble the final video.

### transcript.md Format

**CRITICAL: All narration text MUST be wrapped in `<narration>` tags.**

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
```

### Word Budget Formula

- **Budget (comfortable):** ~2.5 words/sec × window duration × 0.6
- **Hard cap:** ~2.5 words/sec × window duration
- Beats under 1.5s window: mark silent (no narration)

### Key Differences from script.md

| Aspect | script.md | transcript.md |
|--------|-----------|---------------|
| Timing | Target estimates | Actual timestamps from timing.json |
| Purpose | Guides Playwright actions | Guides TTS generation |
| Narration | Draft text in Words column | Final text with TTS tags |
| Structure | Beats with Words/Action tables | Beat narration text only |
| Created | Before recording | After recording |

### TTS Tag Format

**Emotion tags** (before the sentence they affect):
- `[warmly]` — friendly, welcoming. Introductions.
- `[confidently]` — assured, knowledgeable. Feature explanations.
- `[excited]` — energetic. Impressive features.
- `[impressed]` — mildly surprised. "Wow" moments.
- `[casual]` — relaxed. Transitions and minor steps.
- `[serious]` — measured. Security or compliance features.

**Pacing tags** (inline):
- `[pause: 0.3s]` — short breath pause
- `[pause: 0.5s]` — clause break
- `[pause: 1.0s]` — scene transition pause

**Guidelines:**
- One emotion tag per 2-3 sentences.
- If the window is much longer than read time, add pauses rather than words.

### Adjusting Narration to Fit Timing

- **Read time < window:** Add `[pause]` tags or let silence fill the gap.
- **Read time > window:** Trim. Cut adjectives first. Split and drop if still too long.
- **Rule of thumb:** Fill 40-70% of the beat's window. Rest is natural silence.

### TTS Generation via CLI

```bash
demofly tts <name>
```

Options:
- `--voice <name>` — TTS voice (default: `af_heart`). Available: `af_heart`, `af_bella`, `af_nicole`, `af_nova`, `af_sarah`, `am_adam`, `am_michael`.
- `--speed <multiplier>` — Speech rate (default: `1.0`).

Requires Node 22+:
```bash
source ~/.nvm/nvm.sh && nvm use 22 > /dev/null 2>&1 && demofly tts <name>
```

### Final Assembly via CLI

```bash
demofly generate <name>
```

Reads:
- `demofly/<name>/recordings/video.webm`
- `demofly/<name>/recordings/timing.json`
- `demofly/<name>/audio/*.wav` (optional)

Produces `demofly/<name>/recordings/final.mp4`.

The agent does NOT run ffmpeg directly — `demofly generate` handles all assembly.

### Final Quality Checks

Remind the user to verify:
1. Watch the final video — visual quality and audio sync.
2. Audio timing — narration aligns with actions.
3. Volume consistency across scenes.
4. No audio overlap between beats.

---

## 14. Shared Helpers

The helper functions (`createMarker`, `moveTo`, `injectCursor`) are maintained in
a single template file:

```
plugins/demofly/templates/helpers.ts
```

### Setup

Copy into the demo directory before writing `demo.spec.ts`:

```bash
cp plugins/demofly/templates/helpers.ts demofly/<name>/helpers.ts
```

### Usage

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

- **`createMarker()`** — Factory capturing `Date.now()`, returns bound `mark()` function.
- **`moveTo(page, element, prevBox?)`** — Distance-based delay + fake cursor update. Returns new bounding box.
- **`injectCursor(page)`** — Injects `#demofly-cursor` div. Must re-call after `page.goto()`.
- **`createTempDir(demoName)`** — OS-agnostic transient temp directory.
- **`createSessionTmpDir(demoDir)`** — Session `.tmp/` subdirectory inside demo folder.

---

## 15. Artifact Directory Strategy

All generated files go into one of three tiers:

| Tier | Location | Contents | Lifecycle |
|------|----------|----------|-----------|
| **Transient** | OS temp dir (`os.tmpdir()`) | Exploration screenshots, debug captures | OS cleans up on reboot |
| **Session** | `demofly/<name>/.tmp/` | Draft scripts, planning screenshots, debug logs | Gitignored |
| **Final** | `demofly/<name>/` | proposal.md, script.md, demo.spec.ts, recordings/, audio/, transcript.md | Permanent |

### OS-Agnostic Temp Directories

**Never hardcode `/tmp`.** Use the helpers or standalone script:

```bash
# Transient
TMPDIR=$(node scripts/create-temp-dir.js my-demo --type transient)

# Session
SESSDIR=$(node scripts/create-temp-dir.js my-demo --type session)
```

### Where Each Artifact Goes

| Artifact | Tier | Location |
|----------|------|----------|
| Exploration screenshots | Transient | `os.tmpdir()/demofly-<name>-*/` |
| Debug captures / error screenshots | Transient | `os.tmpdir()/demofly-<name>-*/` |
| Draft scripts, intermediate versions | Session | `demofly/<name>/.tmp/` |
| proposal.md, script.md, demo.spec.ts | Final | `demofly/<name>/` |
| timing.json, video.webm, final.mp4 | Final | `demofly/<name>/recordings/` |
| TTS audio files | Final | `demofly/<name>/audio/` |
| transcript.md | Final | `demofly/<name>/` |

### .gitignore

```
demofly/**/.tmp/
```
