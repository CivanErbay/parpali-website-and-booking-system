---
description: Scaffold a new Architecture Decision Record from the template, auto-numbered
allowed-tools: Read, Write, Bash, Glob
---

The user wants to create a new Architecture Decision Record.

Title from arguments: $ARGUMENTS

Steps:

1. If `$ARGUMENTS` is empty, ask the user for the ADR title. Don't proceed without one.
2. List `docs/adr/` files matching `^[0-9]{4}-` to find the highest existing number. Increment by 1, zero-pad to 4 digits → `NNNN`.
3. Slugify the title: lowercase, spaces → hyphens, strip non-alphanumeric except hyphens. Max 60 chars.
4. Read `docs/adr/_template.md`.
5. Write the new ADR to `docs/adr/<NNNN>-<slug>.md` using the template, filling in:
   - `# ADR-NNNN: <Title>` header
   - `## Status` → `Proposed (<today's-ISO-date>)`
   - Leave Context / Decision / Consequences / Alternatives / Revisit-When sections as placeholder prose for the user/agent to fill in.
6. Print:
   - The new file path
   - Reminder: fill in the body sections (or invoke `adr-writer` agent for a draft based on session context)
   - Reminder: when the PR introducing this ADR merges, change Status to `Accepted` and add an entry to `docs/adr/README.md` index
   - Reminder: reference the ADR number in the PR description
