# Dual Codex and Claude Plugin Conversion Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Use test-driven development for hook behavior and fresh verification before completion.

**Goal:** Make the discipline plugin installable and behaviorally equivalent in Codex and Claude Code from one repository.

**Architecture:** Keep `skills/` and `hooks/` shared. Retain `.claude-plugin/` and add `.codex-plugin/` plus `.agents/plugins/` for native host discovery. Use one dual-host Node injector with deterministic tests.

**Tech Stack:** Agent Skills Markdown/YAML, JSON plugin manifests, Node.js ESM, Node's built-in test runner, Codex CLI, Claude Code CLI when installed.

---

### Task 1: Pin the dual-host injector behavior with failing tests

**Files:**

- Create: `test/inject-skills.test.mjs`
- Test: `hooks/inject-skills.mjs`

- [ ] Write tests that run the hook as a child process against temporary plugin and user-skill fixtures.
- [ ] Assert Codex uses `PLUGIN_ROOT` and `~/.agents/skills` semantics.
- [ ] Assert Claude uses `CLAUDE_PLUGIN_ROOT`, `CLAUDE_CONFIG_DIR`, and `~/.claude/skills` semantics.
- [ ] Assert `DISCIPLINE_FORCE_INJECT=1`, `--only`, event propagation, missing skills, and unreadable/unknown skills.
- [ ] Run `node --test test/inject-skills.test.mjs` and confirm the Codex-specific assertions fail against the original implementation.

### Task 2: Implement the shared injector and hook configuration

**Files:**

- Modify: `hooks/inject-skills.mjs`
- Modify: `hooks/hooks.json`

- [ ] Prefer `PLUGIN_ROOT`, fall back to `CLAUDE_PLUGIN_ROOT`, then the script directory.
- [ ] Select the active host's user-skill directory without cross-host false positives.
- [ ] Keep the common hook output schema and silent failure behavior.
- [ ] Keep one command per skill and both lifecycle events.
- [ ] Add a Codex context threshold only if Claude Code accepts the field; otherwise rely on split payloads.
- [ ] Run the hook test suite and confirm every assertion passes.

### Task 3: Add native Codex skill metadata

**Files:**

- Create: `skills/engineering-discipline/agents/openai.yaml`
- Create: `skills/response-discipline/agents/openai.yaml`
- Modify: `skills/engineering-discipline/SKILL.md`
- Modify: `skills/response-discipline/SKILL.md`

- [ ] Preserve the methodology and examples.
- [ ] Replace any host-specific invocation/tool assumptions with host-neutral Agent Skills language.
- [ ] Add deterministic Codex UI metadata with explicit `$engineering-discipline` and `$response-discipline` prompts.
- [ ] Keep `policy.allow_implicit_invocation: true` so discovery remains available before hook trust; rely on the injected preamble to prevent duplicate invocation.
- [ ] Validate each skill with the installed `quick_validate.py` validator.

### Task 4: Add Codex plugin and marketplace packaging

**Files:**

- Create: `.codex-plugin/plugin.json`
- Create: `.agents/plugins/marketplace.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `.gitignore`

- [ ] Keep the stable plugin identifier `discipline` and version `1.4.0` unless schema validation requires a metadata-only patch.
- [ ] Declare `./skills/` in the Codex manifest and use default `hooks/hooks.json` discovery.
- [ ] Add valid Codex interface metadata without nonexistent assets or unsupported dependencies.
- [ ] Add a repository-local marketplace entry pointing to the plugin root.
- [ ] Update Claude descriptions to state dual compatibility while retaining valid Claude shapes.
- [ ] Update ignore comments and keep generated `.skill`, local settings, and marketing drafts excluded.
- [ ] Run installed plugin validation and JSON parsing checks.

### Task 5: Rewrite user documentation

**Files:**

- Modify: `README.md`

- [ ] Lead with dual Claude Code and Codex support.
- [ ] Document remote and local installation for both CLIs.
- [ ] Document Codex hook review through `/hooks` and new-session requirements.
- [ ] List both workflows, invocation examples, extension steps, requirements, and platform-specific limitations.
- [ ] Update testing commands for PowerShell and POSIX shells.
- [ ] Explain every intentional Claude-specific file and reference.

### Task 6: Validate discovery and important workflows

**Files:**

- Test: all manifests, skills, hooks, and docs

- [ ] Run `node --test test/inject-skills.test.mjs`.
- [ ] Parse every JSON file and every `agents/openai.yaml` file.
- [ ] Run Codex skill validation for both skills and plugin validation for the repository.
- [ ] Audit paths and references with `rg -n -i 'claude|CLAUDE_|~/.claude|/plugin|Skill tool|subagent'` and classify each remaining match.
- [ ] Add the repository marketplace to an isolated Codex configuration, list the plugin, install it, and inspect the installed cache/config.
- [ ] Run a non-interactive Codex discovery prompt in a fresh session and capture evidence that the skills/plugin are visible.
- [ ] If `claude` is installed, run its plugin validation/listing flow; otherwise record the missing executable as the only host-level validation limitation.
- [ ] Review `git diff --check`, `git diff --stat`, and `git status --short` before reporting completion.

No commits or pushes are included because the user requested a working conversion in the current workspace, not repository-history changes.
