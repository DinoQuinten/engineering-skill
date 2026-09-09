# Documentation ledger

| ID | Official documentation | Used in | Purpose | Date |
|---|---|---|---|---|
| D1 | https://learn.chatgpt.com/docs/build-skills | `skills/*`, `README.md` | Codex skill layout, discovery paths, invocation policy, and `agents/openai.yaml` | 2026-08-07 |
| D2 | https://developers.openai.com/plugins/build/plugins | `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `hooks/inject-skills.mjs`, `README.md` | Codex plugin packaging, marketplace layout, default hook discovery, and plugin environment variables | 2026-08-07 |
| D3 | https://learn.chatgpt.com/docs/hooks | `hooks/hooks.json`, `hooks/inject-skills.mjs`, `README.md` | Codex lifecycle events, matchers, hook trust, context output, and spill behavior | 2026-08-07 |
| D4 | https://learn.chatgpt.com/docs/agent-configuration/subagents | `hooks/hooks.json`, `README.md` | Codex subagent lifecycle and isolated context behavior | 2026-08-07 |
| D5 | https://code.claude.com/docs/en/plugins | `.claude-plugin/*`, `README.md` | Claude Code plugin and marketplace compatibility | 2026-08-07 |
| D6 | https://code.claude.com/docs/en/hooks | `hooks/hooks.json`, `hooks/inject-skills.mjs`, `README.md` | Claude Code lifecycle events and shared `additionalContext` output schema | 2026-08-07 |
| D7 | https://github.com/earendil-works/pi/blob/v0.84.1/packages/coding-agent/docs/packages.md | `package.json`, `extensions/always-active.js`, `README.md` | Pi package manifest, Git sources, resource paths, and package discovery | 2026-08-10 |
| D8 | https://github.com/earendil-works/pi/blob/v0.84.1/packages/coding-agent/docs/extensions.md | `extensions/always-active.js`, `README.md` | Pi extension registration and `before_agent_start` system-prompt replacement | 2026-08-10 |
| D9 | https://opencode.ai/docs/rules/ | `README.md` | Global instruction files, remote instruction URLs, and configuration merging | 2026-08-10 |
| D10 | https://opencode.ai/v2/docs/skills | `README.md` | OpenCode compatibility skill discovery and on-demand runtime loading | 2026-08-10 |
| D11 | https://www.redwoodink.com/resources/10-tricks-to-reduce-your-word-count-in-academic-writing | `skills/response-discipline/SKILL.md`, `skills/engineering-discipline/SKILL.md` | Word-count reduction method for the concision pass; censused which tricks apply to already-dense rule text | 2026-09-09 |
