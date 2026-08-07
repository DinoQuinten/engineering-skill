# Documentation ledger

| ID | Official documentation | Used in | Purpose | Date |
|---|---|---|---|---|
| D1 | https://learn.chatgpt.com/docs/build-skills | `skills/*`, `README.md` | Codex skill layout, discovery paths, invocation policy, and `agents/openai.yaml` | 2026-08-07 |
| D2 | https://developers.openai.com/plugins/build/plugins | `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `hooks/inject-skills.mjs`, `README.md` | Codex plugin packaging, marketplace layout, default hook discovery, and plugin environment variables | 2026-08-07 |
| D3 | https://learn.chatgpt.com/docs/hooks | `hooks/hooks.json`, `hooks/inject-skills.mjs`, `README.md` | Codex lifecycle events, matchers, hook trust, context output, and spill behavior | 2026-08-07 |
| D4 | https://learn.chatgpt.com/docs/agent-configuration/subagents | `hooks/hooks.json`, `README.md` | Codex subagent lifecycle and isolated context behavior | 2026-08-07 |
| D5 | https://code.claude.com/docs/en/plugins | `.claude-plugin/*`, `README.md` | Claude Code plugin and marketplace compatibility | 2026-08-07 |
| D6 | https://code.claude.com/docs/en/hooks | `hooks/hooks.json`, `hooks/inject-skills.mjs`, `README.md` | Claude Code lifecycle events and shared `additionalContext` output schema | 2026-08-07 |
