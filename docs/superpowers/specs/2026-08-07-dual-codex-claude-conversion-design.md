# Dual Codex and Claude Plugin Conversion Design

## Goal

Convert the discipline plugin to native Codex packaging while retaining first-class Claude Code compatibility and preserving its engineering and response workflows.

## Architecture

Keep the two skill bodies and the hook injector as shared sources of truth. Add platform-specific discovery and distribution metadata around those shared files:

- `.claude-plugin/` remains the Claude Code manifest and marketplace.
- `.codex-plugin/plugin.json` provides the native Codex plugin manifest.
- `.agents/plugins/marketplace.json` provides the native Codex repository marketplace.
- `skills/` remains the shared Agent Skills directory.
- `hooks/` remains the shared lifecycle implementation.

Do not add `AGENTS.md` or `CLAUDE.md`: those files would apply only inside this repository and would not preserve cross-project plugin behavior after installation.

## Skills

Preserve `engineering-discipline` and `response-discipline` as separate skills so each remains independently discoverable and each hook payload stays below context-spill thresholds.

Add `agents/openai.yaml` to each skill for Codex UI metadata. Keep Codex invocation enabled so discovery and explicit `$skill-name` invocation remain available before plugin hooks are trusted. The injected preamble prevents redundant invocation after the hooks load the full skill text. Claude Code ignores this Codex-specific metadata.

Rewrite only platform assumptions in the skill text. Preserve methodology, requirements, examples, and behavioral intent.

## Hooks

Use the default shared `hooks/hooks.json` location discovered by both platforms.

Register one command per skill for:

- `SessionStart` with `startup`, `resume`, `clear`, and `compact` sources.
- `SubagentStart` for every subagent.

The Node injector will:

- Resolve Codex `PLUGIN_ROOT` first, then Claude Code `CLAUDE_PLUGIN_ROOT`, then its own file location for direct tests.
- Detect the active host from `PLUGIN_ROOT` and check the matching user-skill directory: `~/.agents/skills` for Codex or `${CLAUDE_CONFIG_DIR:-~/.claude}/skills` for Claude Code.
- Preserve `DISCIPLINE_FORCE_INJECT=1` as the host-neutral override.
- Return `hookSpecificOutput.additionalContext`, which both hosts support.
- Emit nothing and exit zero when no readable skills are available.

Keep the hook command on `CLAUDE_PLUGIN_ROOT` because current Codex explicitly provides that environment variable as a compatibility alias for plugin hooks. The script itself prefers native `PLUGIN_ROOT` for host detection.

## Packaging

The Codex manifest will identify the existing `discipline` plugin, declare `./skills/`, and rely on default discovery of `hooks/hooks.json`. It will include valid interface metadata without inventing icons, privacy URLs, or MCP dependencies.

The Codex marketplace will expose the repository-root plugin through a local source. The Claude marketplace remains intact with updated dual-platform descriptions.

## Documentation

Rewrite the README around dual installation and usage:

- Codex CLI marketplace and plugin installation.
- Claude Code marketplace and plugin installation.
- Local checkout instructions for both.
- Hook trust requirements in Codex.
- Explicit and implicit skill behavior.
- Workflow summaries and examples.
- Platform-specific limitations and context costs.
- Instructions for adding another shared skill.

## Validation

Add deterministic Node tests for injector behavior before modifying the injector. Cover:

- single-skill and combined output;
- event-name propagation;
- unknown skill and unreadable directory behavior;
- Codex and Claude user-skill precedence;
- force-injection override;
- native `PLUGIN_ROOT` precedence.

Then run:

- JSON and YAML parsing checks;
- installed Codex skill and plugin validators;
- hook tests on Windows;
- direct hook smoke tests for both host environments;
- repository-wide Claude/Codex reference audit;
- `codex plugin marketplace add`, listing, installation, and discovery checks using an isolated Codex home/config where possible;
- Claude CLI validation when the executable is installed, otherwise document that host-level Claude loading was not executable locally.

## Compatibility Boundaries

- Codex requires explicit trust for non-managed plugin hooks; Claude Code has its own hook trust and permission behavior.
- `agents/openai.yaml` affects Codex UI and invocation policy only.
- `.codex-plugin/` and `.agents/plugins/` are ignored by Claude Code; `.claude-plugin/` is retained intentionally for Claude Code.
- The ignored `.skill` archives are generated snapshots, not source-of-truth artifacts, and are not part of native Codex plugin installation.
