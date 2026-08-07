#!/usr/bin/env node
/**
 * Injects every SKILL.md under the plugin's skills/ directory into context.
 *
 * Skills normally load only when the host chooses to invoke them. These are
 * communication/engineering standards that must apply to every response, so
 * their full text is pushed into context instead of relying on invocation.
 *
 * Registered on SessionStart and SubagentStart. SessionStart's matcher includes
 * `compact`, which is what re-injects after a compaction drops the context —
 * PostCompact cannot do this, as it rejects `additionalContext` in its output
 * schema. SubagentStart covers spawned agents, which do not inherit the main
 * session's injected context.
 *
 * ONE SKILL PER INVOCATION. `--only <name>` emits just that skill, and hooks.json
 * registers one command per skill. Concatenating them into a single block was
 * measured at 13.6 KB, over the limit at which Claude Code writes the context to
 * a file and shows the model only a ~2 KB preview — everything past the cut was
 * silently unavailable. Injected individually, both arrive inline in full on
 * Claude Code and stay below Codex's default per-hook context threshold. Keep
 * any single SKILL.md below 9 KB and verify context delivery after it changes.
 *
 * With no `--only`, every skill is emitted as one block. That is the direct-test
 * path; it is subject to the truncation above and is not what hooks.json uses.
 *
 * A skill is SKIPPED when the same name already exists under the user's own
 * host's personal skill directory. Codex uses ~/.agents/skills; Claude Code
 * uses ${CLAUDE_CONFIG_DIR:-~/.claude}/skills. The local copy takes precedence:
 * the user may already inject it from their own hook. The plugin never reads or
 * writes user configuration. Set DISCIPLINE_FORCE_INJECT=1 to inject regardless.
 *
 * Fails silently (exit 0, no output) if the skills directory is missing, so a
 * broken plugin checkout never breaks session startup.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const PREAMBLE =
  'ALWAYS-ACTIVE SKILLS\n' +
  'The skills below are in force for this entire session. Apply them to every ' +
  'response and every task. Do not invoke them again - their full content is ' +
  'already here. They override default response and engineering ' +
  'behavior; explicit user instructions still win.\n';

// docs-used.md#D2 — Codex sets PLUGIN_ROOT and also exposes CLAUDE_PLUGIN_ROOT as a compatibility
// alias. Prefer the native variable so it also identifies the active host.
// Claude Code sets CLAUDE_PLUGIN_ROOT. The file-relative fallback supports
// direct tests on either platform.
const isCodex = Boolean(process.env.PLUGIN_ROOT);
const pluginRoot =
  process.env.PLUGIN_ROOT ||
  process.env.CLAUDE_PLUGIN_ROOT ||
  dirname(dirname(fileURLToPath(import.meta.url)));

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function hookEventName() {
  try {
    return JSON.parse(readStdin()).hook_event_name || 'SessionStart';
  } catch {
    return 'SessionStart';
  }
}

const userSkillsDir = isCodex
  // docs-used.md#D1 — Codex personal skills live under ~/.agents/skills.
  ? join(homedir(), '.agents', 'skills')
  : join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'skills');

/** True when the user has their own copy of this skill, which then owns it. */
function ownedByUser(name) {
  if (process.env.DISCIPLINE_FORCE_INJECT === '1') return false;
  return existsSync(join(userSkillsDir, name, 'SKILL.md'));
}

/** `--only <name>` restricts output to that single skill. */
function requestedSkill() {
  const i = process.argv.indexOf('--only');
  return i !== -1 ? process.argv[i + 1] : null;
}

function collectSkills() {
  const skillsDir = join(pluginRoot, 'skills');
  const only = requestedSkill();
  const names = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => only === null || name === only)
    .sort();

  const bodies = [];
  for (const name of names) {
    if (ownedByUser(name)) continue;
    try {
      bodies.push(readFileSync(join(skillsDir, name, 'SKILL.md'), 'utf8'));
    } catch {
      // Directory without a readable SKILL.md is not a skill — skip it.
    }
  }
  return bodies;
}

const event = hookEventName();

let bodies = [];
try {
  bodies = collectSkills();
} catch {
  // skills/ missing or unreadable — emit nothing rather than failing the session.
}

if (bodies.length > 0) {
  // docs-used.md#D3 and #D6 — both hosts accept this additionalContext shape.
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: event,
        additionalContext: PREAMBLE + '\n\n' + bodies.join('\n\n---\n\n'),
      },
      suppressOutput: true,
    })
  );
}

process.exit(0);
