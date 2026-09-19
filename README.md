# discipline for Codex, Claude Code, Pi, and OpenCode

`discipline` supplies three shared skills for evidence-first communication, engineered software work, and agent task tracking. Codex, Claude Code, Pi, and OpenCode all use the unchanged `skills/` files as their source of truth.

Codex and Claude Code use lifecycle hooks. Pi uses a native package extension. OpenCode loads the same files through global `instructions`. All four integrations keep all skill bodies active without relying on model-selected skill invocation.

## Capabilities

| Skill | Enforced workflow |
|---|---|
| `response-discipline` | Direct answers, no filler or unsupported agreement, evidence before conclusions, concise structure, and RCA-formatted failure reports. |
| `engineering-discipline` | Official-docs-first implementation, a `docs-used.md` ledger, the YAGNI ladder, root-cause fixes, behavior-level tests, blast-radius checks, and executed verification. |
| `task-registry` | Append-only `registry.jsonl` recording every task any agent, sub-agent, or worker job performs — including no-diff work like audits, RCA, and decisions. |

| Host | Always-active mechanism | On-demand discovery |
|---|---|---|
| Codex | `SessionStart` and `SubagentStart` hooks | `agents/openai.yaml` and `~/.agents/skills` |
| Claude Code | `SessionStart` and `SubagentStart` hooks | Claude skill discovery |
| Pi | Native `before_agent_start` extension | Package `skills` resources |
| OpenCode | Global `opencode.json` `instructions` | `~/.agents/skills` compatibility source |

The package and extension shapes follow [docs-used.md D7 and D8](docs-used.md). OpenCode instruction and skill behavior follows [docs-used.md D9 and D10](docs-used.md).

## Install in Codex

### From GitHub

```text
codex plugin marketplace add DinoQuinten/engineering-skill
codex plugin add discipline@dinoquinten
```

Start a new session. Open `/hooks`, review the two plugin hook definitions, and trust them. Codex skips non-managed plugin hooks until their current definitions are trusted.

### From a local checkout

```text
codex plugin marketplace add /absolute/path/to/engineering-skill
codex plugin add discipline@dinoquinten
```

Codex manages installed copies under `~/.codex/plugins/cache/dinoquinten/discipline/`. Do not edit the cache. Edit the checkout, refresh or reinstall the marketplace plugin, then start a new session.

Codex also discovers standalone personal skills under `~/.agents/skills/<skill-name>/SKILL.md`. Standalone installation does not include the always-active hooks.

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

Claude Code manages installed copies under `~/.claude/plugins/cache/dinoquinten/discipline/`. Edit the checkout rather than the cache, then update or reinstall the plugin and restart the session.

The `.claude-plugin/` files are intentional compatibility metadata, not leftovers.

## Install in Pi

Install the GitHub package at the release tag:

```text
pi install git:github.com/DinoQuinten/engineering-skill@v1.9.0
```

For a local checkout:

```text
pi install /absolute/path/to/engineering-skill
```

Pi reads `package.json`, discovers all three shared skills, and loads `extensions/always-active.js`. The extension reads all required `SKILL.md` files during initialization and reports an error if any is missing or unreadable.

On every `before_agent_start`, the extension appends the always-active preamble and all complete skill bodies to the current chained system prompt. It preserves the existing prompt and returns no persistent conversation message.

## Install in OpenCode

OpenCode has two ways to auto-inject the skills: a self-contained plugin (recommended) or global `instructions`.

### Self-injecting plugin (recommended)

`extensions/opencode-discipline.js` is one classic OpenCode plugin that loads every skill itself:

- `response-discipline`, `engineering-discipline`, and `task-registry` are appended to every system prompt.
- `planning-discipline` is appended only while the Plan agent is active.

Reference it from the `plugin` array by absolute path — no copying, so the skill path always resolves to this checkout:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["/absolute/path/to/engineering-skill/extensions/opencode-discipline.js"]
}
```

Or copy `extensions/opencode-discipline.js` and `extensions/skill-body.js` into `~/.config/opencode/plugin/` and copy `skills/` into `~/.config/opencode/skills/`; the plugin resolves skill files relative to its own directory.

The plugin uses `chat.message` to learn the active agent, because the classic `experimental.chat.system.transform` hook carries no agent identity. Verified on OpenCode 1.18.31: the build agent gets the always-active block only, the Plan agent gets the always-active block plus `planning-discipline`, and neither block is duplicated within one system build.

Known overhead: OpenCode rebuilds the system prompt for auxiliary calls (session title, compaction) and the classic transform cannot tell them apart, so the always-active block is also added there. Use the `instructions` route below if that cost matters. Do not load `opencode-planning-classic.js` alongside this plugin — it is the earlier reminder-only adapter and is superseded by this one.

### Always-active remote instructions

Merge the `instructions` entries below into the existing `~/.config/opencode/opencode.json`. Preserve every existing key and every existing instruction entry; do not replace the file.

```json
{
  "instructions": [
    "https://raw.githubusercontent.com/DinoQuinten/engineering-skill/v1.9.0/skills/response-discipline/SKILL.md",
    "https://raw.githubusercontent.com/DinoQuinten/engineering-skill/v1.9.0/skills/engineering-discipline/SKILL.md",
    "https://raw.githubusercontent.com/DinoQuinten/engineering-skill/v1.9.0/skills/task-registry/SKILL.md"
  ]
}
```

The `v1.9.0` tag pins instruction behavior. Upgrade all three URLs together when adopting a later release.

### Local or offline instructions

Clone or download the repository, then use absolute local paths instead of the remote URLs. OpenCode resolves relative instruction paths from the active working directory, so global configuration should use absolute paths.

```json
{
  "instructions": [
    "/absolute/path/to/engineering-skill/skills/response-discipline/SKILL.md",
    "/absolute/path/to/engineering-skill/skills/engineering-discipline/SKILL.md",
    "/absolute/path/to/engineering-skill/skills/task-registry/SKILL.md"
  ]
}
```

On Windows, use JSON paths such as `C:/absolute/path/to/engineering-skill/skills/response-discipline/SKILL.md`.

### On-demand skill discovery

Place or link both skill directories at these compatibility paths:

```text
~/.agents/skills/response-discipline/SKILL.md
~/.agents/skills/engineering-discipline/SKILL.md
~/.agents/skills/task-registry/SKILL.md
```

Verify the merged global configuration and discovered skills:

```text
opencode debug config
opencode debug skill
```

OpenCode always includes configured `instructions`. Discovered skills work differently: OpenCode advertises their names and descriptions, then adds a body only when the model or user invokes the skill tool. Keep the global instruction entries when always-active enforcement is required.

## Use

After the host-specific installation, normal prompts need no prefix:

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

Codex users can still invoke `$engineering-discipline` or `$response-discipline`. Pi and OpenCode also discover the skills for on-demand use. In Codex, Claude Code, and Pi, the always-active preamble tells the model not to load the full bodies again. OpenCode keeps its skill tool available even when global `instructions` already loaded the same bodies.

## Lifecycle coverage

| Host | Moment | Integration | Result |
|---|---|---|---|
| Codex and Claude Code | New, resumed, cleared, or compacted root session | `SessionStart` | Inject each skill in a separate hook payload. |
| Codex and Claude Code | Every subagent | `SubagentStart` | Apply the same standards in isolated context. |
| Codex and Claude Code | Entering or leaving plan mode | `PostToolUse` (`EnterPlanMode`/`ExitPlanMode`) | Inject `planning-discipline` on entry, clear its session marker on exit. |
| Pi | Every submitted agent prompt | `before_agent_start` | Append all skills plus the planning reminder to the current chained system prompt. |
| OpenCode | Every session using global config | `instructions` | Load all version-pinned files into context. |

`PostCompact` is not used for Codex or Claude Code instruction injection. Both hosts provide compact recovery through `SessionStart` with a `compact` source.

## Layout

```text
.
├── .agents/plugins/marketplace.json       # Codex repository marketplace
├── .claude-plugin/                        # Claude Code manifest and marketplace
├── .codex-plugin/plugin.json              # Codex manifest
├── extensions/always-active.js            # Native Pi before_agent_start extension
├── extensions/opencode-discipline.js      # OpenCode classic all-in-one self-injecting plugin
├── extensions/opencode-planning.js        # OpenCode v2 Plan-agent context hook
├── extensions/opencode-planning-classic.js # OpenCode classic reminder transform (superseded)
├── extensions/skill-body.js               # Shared skill-body reader for adapters
├── hooks/                                 # Shared Codex and Claude Code hooks
├── package.json                           # Native Pi package manifest
├── skills/                                # Shared source-of-truth skill bodies
└── test/                                  # Hook and Pi package behavior tests
```

## Codex and Claude Code hook behavior

| Host | Plugin root | Personal skill ownership |
|---|---|---|
| Codex | `PLUGIN_ROOT` | `~/.agents/skills/<name>/SKILL.md` |
| Claude Code | `CLAUDE_PLUGIN_ROOT` | `${CLAUDE_CONFIG_DIR:-~/.claude}/skills/<name>/SKILL.md` |

Codex also supplies `CLAUDE_PLUGIN_ROOT` as a compatibility alias. `hooks/hooks.json` uses that alias so one command works in both hosts; the injector prefers native `PLUGIN_ROOT` when Codex runs it.

If a matching personal skill exists, the plugin skips its copy. The personal copy owns its activation behavior. Set `DISCIPLINE_FORCE_INJECT=1` to force the plugin copy during testing.

Each skill is registered as its own hook command so every payload stays inline instead of spilling to a file-backed preview.

**The cap is 10,000 characters of `additionalContext`**, measured by bisection against live sessions: 10,000 characters arrived inline, 10,081 was replaced by a ~1.7 KB preview with the remainder silently unavailable. Injectors strip the YAML frontmatter before emitting — it is disk-only metadata for host discovery, worth ~1.7 KB across the three skills — and `test/inject-skills.test.mjs` enforces the budget against the real `skills/` directory, so the limit is a test rather than a comment.

### Keeping personal copies in sync

If a matching skill exists under your personal skills directory, the plugin skips its own copy, so hand-editing both produces two forks that drift. Author skills in this repo and regenerate the personal copies:

```bash
npm run sync        # repo -> ~/.claude/skills (only names already present there)
npm run sync:check  # exits 1 if a personal copy has drifted from the repo
```

## Add another shared skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter.
2. Add `skills/<name>/agents/openai.yaml` for Codex presentation and invocation policy.
3. Add one command for the skill under both events in `hooks/hooks.json`.
4. Add the skill to the Pi extension's required list if it must be always active there.
5. Add its version-pinned URL or absolute path to OpenCode's global `instructions`.
6. Add behavior tests before changing an injector.

## Plan-mode skill

`planning-discipline` covers decomposition, bounded alternative analysis, self-consistency, and read-only ReAct investigation. It applies only while a plan is being produced; it never authorizes execution, workers, or permission changes. Debate stays off until the user opts in once per planning task.

### Activation per host

| Host | Full skill | When detection is unavailable |
|---|---|---|
| Codex | `SessionStart` / `UserPromptSubmit` / `PostToolUse` when `permission_mode: "plan"` | Compact reminder (host omitted `permission_mode`); nothing for an explicit non-plan mode |
| Claude Code | Same, plus `PostToolUse` on a successful `EnterPlanMode` | Compact reminder on absent mode |
| OpenCode v2 | `context` hook when `event.agent === "plan"` (`extensions/opencode-planning.js`) | Not needed; agent identity is available |
| OpenCode classic | `extensions/opencode-discipline.js` tracks the agent from `chat.message`, then appends the skill on `experimental.chat.system.transform` | Compact reminder plus skill path (`extensions/opencode-planning-classic.js`) |
| Pi | Official planner calls the bridge inside its own active plan branch | Compact reminder in the always-active preamble |

The injector records a per-session marker so the full skill is not re-injected on every prompt. `SessionStart` with a `compact` or `clear` source refreshes it; `ExitPlanMode` clears it. With no `session_id` the guard is skipped (fails open to a duplicate rather than dropping discipline).

### Pi bridge

Pi has no universal cross-extension plan-state API, so the official plan-mode extension calls the bridge from inside the branch where it already knows plan mode is active:

```js
import { getPlanningDisciplineInstructions } from 'discipline/extensions/always-active.js';

// Inside the planner's before_agent_start handler, plan branch already chosen:
const planBody = getPlanningDisciplineInstructions();
return { systemPrompt: event.systemPrompt + '\n\n' + planBody };
```

The helper returns an empty string when the skill is absent, so the bridge cannot break the planner. Other Pi planners keep explicit skill invocation. This package does not replace Pi's planner or its tool restrictions.

### OpenCode

v2: add `extensions/opencode-planning.js` to the plugin list; it appends the full skill for the `plan` agent and skips duplicates already in the outgoing context.

Classic (verified against OpenCode 1.18.31): copy `extensions/opencode-planning-classic.js` and `extensions/skill-body.js` into `<config>/opencode/plugin/`. Any `.js`/`.ts` file in that directory is auto-loaded — no `plugins` array entry is needed — and a `default` or named export that is `async () => hooks` is accepted. The adapter registers `experimental.chat.system.transform` and can only add the discovery reminder, because that hook carries no agent identity. The reminder names the resolved skill path only when that path exists, so a relocated adapter degrades to the pathless reminder rather than pointing at a missing file. OpenCode discovers skills from `<config>/opencode/skill/<name>/SKILL.md` and `<config>/opencode/skills/<name>/SKILL.md`; `opencode debug skill` lists them.

Each skill stays under the measured 10,000-character `additionalContext` cap; `test/inject-skills.test.mjs` enforces it.

## Test

Run all deterministic suites:

```text
node --test test/inject-skills.test.mjs test/pi-package.test.mjs test/opencode-planning.test.mjs
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

The hook emits one JSON object whose `hookSpecificOutput.additionalContext` contains only the requested skill. An unknown `--only` name or unreadable `skills/` directory produces no output and exits zero.

## Limitations

- Always-active integration consumes the complete text of all skills in host context.
- Codex requires users to review and trust non-managed plugin hooks after installation or hook changes.
- OpenCode remote instructions require network access at session start; use absolute local paths for offline operation.
- OpenCode on-demand discovery alone does not enforce always-active behavior.
- Pi extensions run with the installing user's system permissions; review the source before installation.
- Host-specific metadata has no effect in other hosts.
- A personal skill with the same name suppresses Codex or Claude Code plugin injection only for its matching host.
- Generated `.skill` archives are ignored snapshots. `skills/` is the source of truth.
- Plan-mode activation depends on host-reported fields verified against the docs in `docs-used.md#D13`, not on live host runs: Codex and Claude Code `permission_mode`, Claude `EnterPlanMode`, OpenCode v2 `event.agent`. Codex `permission_mode` may be absent in older builds or wrappers; those hosts fall back to the compact reminder.
- The per-session dedup marker lives under the OS temp directory (`DISCIPLINE_STATE_DIR` overrides it). Hosts that omit `session_id` get no dedup.
- OpenCode classic cannot detect the active agent, so it only adds the reminder — it does not guarantee full activation. Verified on OpenCode 1.18.31: the plugin loads and `experimental.chat.system.transform` fires with `output.system` as a string array; the transform fires once per system-prompt build, and the adapter's `includes()` guard prevents a duplicate within one build.
- The classic adapter computes the skill path relative to its own file, so install it beside `skill-body.js` with the repo's `skills/` sibling, or the reminder drops the path (by design).

## Requirements

- One supported host: Codex with plugin and hook support, Claude Code with plugin support, Pi 0.84.1, or OpenCode with global instructions support.
- Node.js on `PATH` for Codex and Claude Code lifecycle injection and repository tests.
- Network access for GitHub installation and OpenCode remote instructions; local checkout paths support offline use.

## License

MIT
