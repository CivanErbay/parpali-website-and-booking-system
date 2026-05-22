---
description: Supersede an existing ADR with a new one (scaffolds new ADR, marks old one Superseded — never deletes)
allowed-tools: Read, Write, Edit, Glob, Bash
---

The user wants to supersede an existing ADR with a new decision.

Argument format: `<old-adr-number> <new-title>` — e.g., `/adr-supersede 0007 "Switch from MongoDB to Postgres for chat"`

$ARGUMENTS

Steps:

1. Parse `$ARGUMENTS`:
   - First token = old ADR number (accept `7`, `0007`, `ADR-7`, or `ADR-0007` — normalize to 4-digit zero-padded)
   - Rest = new ADR title
   - If either is missing, ask the user.
2. Verify the old ADR exists at `docs/adr/<NNNN>-*.md` via glob. If not found, list closest matches and ask.
3. Use the same scaffold flow as `/adr-new` to create the new ADR. In the new ADR's body, immediately under the title, add:
   ```
   > Supersedes ADR-NNNN.
   ```
4. **Edit the old ADR** — change ONLY the `## Status` section's first line to:
   ```
   Superseded by ADR-MMMM (<today's-ISO-date>)
   ```
   Do NOT touch any other section of the old ADR. Its history stays intact. Do NOT delete the file under any circumstance.
5. Print both file paths and remind the user to commit both files together with a message referencing both ADR numbers (e.g., `docs(adr): ADR-0009 supersedes ADR-0007 — switch chat store to Postgres`).
