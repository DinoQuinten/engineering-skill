# discipline

A Claude Code plugin that keeps two behavioral skills active in every session: how Claude **responds**, and how Claude **engineers**.

## What it does

| Skill | Enforces |
|---|---|
| `response-discipline` | No filler openers, no hedging, no text walls. Verify before concluding. RCA format for every error or failure. Relevance-scoped answers. |
| `engineering-discipline` | Docs-first over training memory (with a `docs-used.md` ledger). YAGNI ladder before writing code. Root-cause fixes, never symptom patches. Behavior-level tests. Executed verification, never claimed. |

Both are injected at session start rather than loaded on demand, so they apply to every response — including the first one, before Claude has decided whether a skill is "relevant". They are re-injected after compaction, which would otherwise drop them.

## Install

```
/plugin marketplace add <your-github-user>/<this-repo>
/plugin install discipline@botpresso
```

Restart the session. Verify with `/context` — the skills appear as SessionStart hook context.

Local checkout instead:

```
/plugin marketplace add /absolute/path/to/this/repo
/plugin install discipline@botpresso
```

## Layout

```
.
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest
│   └── marketplace.json     # makes this repo installable as a marketplace
├── hooks/
│   ├── hooks.json           # registers SessionStart + PostCompact
│   └── inject-skills.mjs    # reads skills/*/SKILL.md → additionalContext
└── skills/
    ├── engineering-discipline/SKILL.md
    └── response-discipline/SKILL.md
```

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter.
2. Done. `inject-skills.mjs` discovers skill directories by listing `skills/`, so no hook or manifest edit is needed.

Directories are injected in sorted order. A directory with no `SKILL.md` is skipped.

## Making them on-demand instead

Delete `hooks/` and the `"hooks"` key from `.claude-plugin/plugin.json`. Claude Code still auto-discovers `skills/` and loads each one when its `description` matches the task — lower baseline context cost, but no guarantee it fires on a given response.

## Requirements

- Claude Code with plugin support
- `node` on `PATH` (used by the SessionStart hook)

## Testing the hook

```bash
echo '{"hook_event_name":"SessionStart"}' \
  | CLAUDE_PLUGIN_ROOT="$PWD" node hooks/inject-skills.mjs \
  | jq -r '.hookSpecificOutput.additionalContext' | head -20
```

Expected: exit 0, one JSON object, both skill bodies under an `ALWAYS-ACTIVE SKILLS` preamble. The hook echoes back whatever `hook_event_name` it receives, and emits nothing at all if `skills/` is unreadable.

## Conflicts with an existing setup

If you already inject these skills from `~/.claude/settings.json` (e.g. a personal `always-active-skills.py` on SessionStart/PostCompact), remove those hook entries before installing — otherwise both fire and the skills land in context twice.

## License

MIT
