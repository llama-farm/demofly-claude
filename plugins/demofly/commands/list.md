---
description: List all demos in the project and show their current phase
tools:
  - Bash
  - Glob
  - Read
disable-model-invocation: false
---

Scan the user's project for demos and report their status.

## Steps

1. **Check if `demofly/` directory exists** in the project root.
   - Use Bash to run: `ls -d demofly/ 2>/dev/null`
   - If it does not exist, respond with:
     ```
     No demos found. Create one with `/demofly:create <name>`.
     ```
     Then stop.

2. **Check for shared context** by looking for the file `demofly/context.md`.

3. **Find all demo subdirectories** inside `demofly/`.
   - Use Bash to list only directories: `ls -d demofly/*/ 2>/dev/null`
   - Exclude any files at the top level of `demofly/` (like `context.md`). Only subdirectories count as demos.
   - If there are no subdirectories, respond with:
     ```
     No demos found. Create one with `/demofly:create <name>`.

     Shared context: exists (demofly/context.md)
     ```
     (Include the shared context line only if `demofly/context.md` exists; otherwise omit it.)
     Then stop.

4. **Determine the phase of each demo** by checking which files exist in the subdirectory. Phases are ordered from least to most advanced:

   | Priority | Condition | Phase |
   |----------|-----------|-------|
   | 1 (lowest) | No recognized files | initialized |
   | 2 | `proposal.md` exists | proposed |
   | 3 | `script.md` exists | scripted |
   | 4 | `demo.spec.ts` exists | built |
   | 5 | `recordings/` directory contains at least one `.webm`, `.mp4`, or `.mov` file | recorded |
   | 6 (highest) | `transcript.md` exists | narrated |

   For each demo, report the **most advanced** phase (highest priority match).

   Use Glob to check for files within each demo subdirectory. For the recordings check, glob for `demofly/<name>/recordings/*.{webm,mp4,mov}`.

5. **Output the results** in this exact format:

   ```
   Demos:
   - <demo-name>: <phase>
   - <demo-name>: <phase>

   Shared context: exists (demofly/context.md)
   ```

   - Sort demos alphabetically by name.
   - The demo name is just the subdirectory name (not the full path).
   - If `demofly/context.md` does not exist, show: `Shared context: not found`
   - Do NOT wrap the output in a code block. Present it as plain text.
