---
description: List all ADRs with their current status, parsed from each file
allowed-tools: Read, Glob, Bash
---

List all Architecture Decision Records and their current status.

Steps:

1. Glob `docs/adr/[0-9]*.md` (this excludes `_template.md` and `README.md`).
2. For each matched file, read it and extract:
   - **Number** — from the filename (`NNNN-*.md`)
   - **Title** — from the first line matching `# ADR-NNNN:`
   - **Status** — from the first non-blank line after `## Status` (e.g., `Accepted (2026-05-14)`, `Proposed (...)`, `Superseded by ADR-0009 (...)`)
3. Print as a fixed-width table:

   ```
   ADR    Status                       Title
   ----   --------------------------   ------------------------------------------
   0000   Accepted (2026-05-14)        Record Architecture Decisions
   0001   Accepted (2026-05-14)        Decommission Webflow Code Components
   ...
   ```

4. After the table, print summary counts grouped by status prefix: e.g., `6 Accepted · 0 Proposed · 0 Superseded · 0 Deprecated`.
