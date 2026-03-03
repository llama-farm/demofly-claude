## Context

Beat headings use colon-delimited shorthand (`scene:action:target`) while `mark()` emits pipe-delimited console output. Not documented.

## Goals

- Add one explanatory paragraph to SKILL.md Section 6

## Non-Goals

- Changing any format
- Modifying any code
- Cross-references (the relationship is simple enough for inline explanation)

## Decisions

1. Add the note after the beat heading format definition in Section 6, right after the line explaining that marker IDs must match `mark()` calls. One paragraph covering: colons are shorthand for the three `mark()` args, pipes are the console output format.
