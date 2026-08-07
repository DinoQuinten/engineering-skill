# discipline

An always-active engineering and communication discipline plugin for **Codex** and **Claude Code**.

The repository keeps one shared implementation for both hosts: two Agent Skills plus lifecycle hooks that load them before the first response, after compaction, and in every subagent.

## What it enforces

| Skill | Workflow |
|---|---|
| `response-discipline` | Direct answers, no filler or unsupported agreement, evidence before conclusions, concise structure, and RCA-formatted failure reports. |
| `engineering-discipline` | Official-docs-first implementation, a `docs-used.md` ledger, the YAGNI ladder, root-cause fixes, behavior-level tests, blast-radius checks, and executed verification. |

Both skills remain separate so each hook payload stays inline instead of spilling to a file-backed preview.

## Install in Codex

### From GitHub

```text
codex plugin marketplace add DinoQuinten/engineering-skill
codex plugin add discipline@dinoquinten
```

Start a new Codex session after installation. Open `/hooks`, review the two plugin hook definitions, and trust them. Codex skips non-managed plugin hooks until their current definitions are trusted.

### From a local checkout

```text
codex plugin marketplace add /absolute/path/to/engineering-skill
codex plugin add discipline@dinoquinten
```

Codex manages installed copies under:

```text
~/.codex/plugins/cache/dinoquinten/discipline/
```

Do not edit the cache. Edit the checkout, refresh or reinstall the marketplace plugin, then start a new session.

Codex also discovers standalone personal skills under `~/.agents/skills/<skill-name>/SKILL.md`, but standalone installation does not include this plugin's always-active hooks.

## Install in Claude Code

### From GitHub

```text
/plugin marketplace add DinoQuinten/engineering-skill
/plugin install discipline@dinoquinten
```

Restart the session. Use `/context` to confirm that both skills appear in `SessionStart` hook context.

### From a local checkout

```text
/plugin marketplace add /absolute/path/to/engineering-skill
/plugin install discipline@dinoquinten
```

Claude Code continues to use `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Those files are intentional compatibility metadata, not leftovers.

Claude Code manages installed copies under:

```text
~/.claude/plugins/cache/dinoquinten/discipline/
```

Edit the checkout rather than the cache, then update or reinstall the plugin and restart the session.

## Use

Installation activates both skills automatically. Normal prompts need no prefix:

```text
Fix the failed sync and verify the behavior through its public API.
```

Expected workflow:

1. Inspect evidence before agreeing with a premise.
2. Read current official documentation before relying on external APIs or configuration formats.
3. Find and fix the root mechanism.
4. Add behavior-level regression coverage.
5. Run verification and report its actual output.
6. Format failures as Issue → Root cause → Fix → Verification.

Codex users can also invoke a skill explicitly:

```text
$engineering-discipline review this migration plan
$response-discipline rewrite this incident report
```

Codex invocation remains enabled in each skill's `agents/openai.yaml`. This keeps `$skill-name` invocation and normal skill discovery available when plugin hooks have not been trusted yet. Once hooks inject the full text, their preamble tells the model not to invoke the same skills again.

## Lifecycle coverage

| Moment | Hook | Purpose |
|---|---|---|
| New, resumed, or cleared session | `SessionStart` | Apply both skills before the first response. |
| After compaction | `SessionStart` with `compact` source | Restore instructions removed from active context. |
| Every subagent | `SubagentStart` | Apply the same standards inside isolated agent contexts. |

`PostCompact` is not used for instruction injection. Both hosts provide the supported compact-recovery path through `SessionStart` with a `compact` source.

## Layout

```text
.
├── .agents/plugins/marketplace.json       # Codex repository marketplace
├── .claude-plugin/
│   ├── marketplace.json                   # Claude Code marketplace
│   └── plugin.json                        # Claude Code manifest
├── .codex-plugin/plugin.json              # Codex manifest
├── hooks/
│   ├── hooks.json                         # Shared lifecycle registration
│   └── inject-skills.mjs                  # Shared dual-host injector
├── skills/
│   ├── engineering-discipline/
│   │   ├── agents/openai.yaml             # Codex UI/invocation metadata
│   │   └── SKILL.md                       # Shared skill instructions
│   └── response-discipline/
│       ├── agents/openai.yaml
│       └── SKILL.md
└── test/inject-skills.test.mjs            # Cross-host hook tests
```

## Cross-platform hook behavior

The hook uses the native root supplied by each host:

| Host | Plugin root | Personal skill ownership |
|---|---|---|
| Codex | `PLUGIN_ROOT` | `~/.agents/skills/<name>/SKILL.md` |
| Claude Code | `CLAUDE_PLUGIN_ROOT` | `${CLAUDE_CONFIG_DIR:-~/.claude}/skills/<name>/SKILL.md` |

Codex also supplies `CLAUDE_PLUGIN_ROOT` as a documented compatibility alias. `hooks/hooks.json` uses that alias so the same command works in both hosts; the injector prefers native `PLUGIN_ROOT` when Codex runs it.

If a matching personal skill exists, the plugin skips its copy. The personal copy owns its activation behavior. Set `DISCIPLINE_FORCE_INJECT=1` to force the plugin copy during testing.

## Add another shared skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter.
2. Add `skills/<name>/agents/openai.yaml` for Codex presentation and invocation policy.
3. Add one command for the skill under both events in `hooks/hooks.json`:

```json
{
  "type": "command",
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/inject-skills.mjs\" --only <name>",
  "statusMessage": "Loading <name>..."
}
```

4. Keep the individual skill below 9 KB or explicitly test host context-spill behavior.
5. Add hook tests before changing the injector.

## Test

Run the deterministic hook suite:

```text
node --test test/inject-skills.test.mjs
```

PowerShell smoke test for Codex:

```powershell
$env:PLUGIN_ROOT = (Get-Location).Path
'{"hook_event_name":"SessionStart","source":"startup"}' |
  node hooks/inject-skills.mjs --only response-discipline
```

POSIX smoke test for Claude Code:

```bash
echo '{"hook_event_name":"SessionStart","source":"startup"}' \
  | CLAUDE_PLUGIN_ROOT="$PWD" node hooks/inject-skills.mjs --only response-discipline
```

Expected output is one JSON object whose `hookSpecificOutput.additionalContext` contains only the requested skill. An unknown `--only` name or unreadable `skills/` directory produces no output and exits zero.

## Limitations

- Always-active injection consumes the complete text of both skills in every root session and subagent.
- Codex requires users to review and trust non-managed plugin hooks after installation or hook changes.
- Codex-specific `agents/openai.yaml` metadata has no effect in Claude Code.
- Claude Code's `.claude-plugin/` metadata has no effect on native Codex packaging, although Codex retains legacy marketplace compatibility.
- A personal skill with the same name suppresses plugin injection only for its matching host; the user must provide any desired always-active mechanism for that personal copy.
- Generated `.skill` archives are ignored snapshots. `skills/` is the source of truth for both hosts.

## Requirements

- Codex with plugin and hook support, or Claude Code with plugin support.
- Node.js on `PATH` for lifecycle injection and tests.

## License

MIT
