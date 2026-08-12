# CLAUDE.md

Guidelines for AI coding agents working in this repo. Keep changes
aligned with these.

## Working style

- Think before coding: state assumptions, surface tradeoffs, and ask
  when a requirement is unclear instead of guessing.
- Bias toward caution over speed.

## Code

- Simplicity first: the minimum code to meet the requirement. No
  speculative features or abstractions.
- Surgical changes: touch only what the task needs, match the existing
  style, and remove only orphans your own change created.
- Goal-driven: for multi-step tasks, state a brief plan and define
  verifiable success criteria.

## Formatting

- Wrap long lines in code and prose; avoid horizontal scroll.
- Use a regular hyphen, never an em dash.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
