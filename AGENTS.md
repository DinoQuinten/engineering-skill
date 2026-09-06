# Repository Guidelines

## Project Structure & Module Organization

This repository packages shared discipline skills for Codex, Claude Code, Pi, and OpenCode.

- `skills/<skill-name>/SKILL.md` is the source of truth; optional `agents/openai.yaml` files provide discovery metadata.
- `hooks/inject-skills.mjs` and `hooks/hooks.json` implement lifecycle injection for Codex and Claude Code.
- `extensions/always-active.js` provides the native Pi integration.
- `.codex-plugin/`, `.claude-plugin/`, and `.agents/plugins/` contain plugin and marketplace metadata.
- `test/` contains behavior tests. `docs/superpowers/` holds design and implementation documents; `docs-used.md` records documentation sources.
- Generated `*.skill` bundles and `socia-media/` marketing drafts are ignored; edit the shared skill sources.

## Build, Test, and Development Commands

Run commands from the repository root with Node.js on `PATH`:

- `node --test test/inject-skills.test.mjs test/pi-package.test.mjs` runs the complete existing suite.
- `node --test test/inject-skills.test.mjs` checks lifecycle injection independently.
- `node --test test/pi-package.test.mjs` checks Pi packaging and prompt injection.

There is no build step, development server, dependency installation requirement, or npm script configured. Follow `README.md` for local host installation and smoke checks; edit this checkout rather than installed plugin caches.

## Coding Style & Naming Conventions

Follow existing JavaScript ES modules: two-space indentation, single-quoted strings, semicolons, camelCase functions, and uppercase constants. Use lowercase kebab-case skill directories and descriptive `*.test.mjs` filenames. Preserve Markdown front matter and concise headings in skills. No formatter or linter is configured.

## Testing Guidelines

Tests use `node:test` and `node:assert/strict`; no coverage threshold is configured. Add behavior tests for injector changes, covering emitted context, host selection, personal-skill precedence, and missing files. Use temporary fixtures and clean them up. Verify full context delivery in affected hosts after skill changes.

## Commit & Pull Request Guidelines

Recent commits use `feat:`, `fix:`, `docs:`, and `chore:` prefixes with short imperative summaries. Follow that pattern. Pull requests should explain the behavior change, affected hosts, and executed checks; link relevant issues and report failures. Keep release versions consistent across package and plugin metadata. Record external documentation informing implementation decisions in `docs-used.md` and reference its entry IDs in code.
