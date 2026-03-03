# Project Rules

## OpenSpec Required for All Changes

All feature work, bug fixes, enhancements, refactors, and non-trivial modifications MUST go through the OpenSpec workflow. Do NOT write implementation code without an active OpenSpec change.

### When a user asks you to build, fix, add, change, or improve something:

1. **Do NOT start coding.** Instead, route through OpenSpec.
2. **If the request is vague or exploratory**, start with `/opsx:explore` to think it through first.
3. **If the request is clear and ready to go**, use `/opsx:ff <change-name>` to create the change and generate all artifacts in one pass.
4. **If the user wants step-by-step control**, use `/opsx:new <change-name>` then `/opsx:continue` to advance one artifact at a time.

### The full workflow:

```
Explore  -->  Create Change  -->  Implement  -->  Verify  -->  Archive
/opsx:explore   /opsx:ff or        /opsx:apply    /opsx:verify   /opsx:archive
                /opsx:new +
                /opsx:continue
```

### Rules:

- **No implementation without a change.** If tasks don't exist yet, create the change first.
- **Always verify before archiving.** Run `/opsx:verify` to check completeness, correctness, and coherence.
- **Sync specs before archiving.** If delta specs exist, `/opsx:archive` will prompt to sync them to main specs.
- **One change per concern.** Don't bundle unrelated work into a single change.
- **Keep tasks focused.** Each task should be a small, well-scoped unit of work.

### Exceptions (no OpenSpec needed):

- Typo fixes in comments or documentation (one-line changes)
- Updating dependency versions with no code changes
- Changes to this CLAUDE.md file or OpenSpec config

### When in doubt:

Ask the user: "This looks like it needs an OpenSpec change. Want me to create one with `/opsx:ff`?"
