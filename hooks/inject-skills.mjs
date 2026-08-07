#!/usr/bin/env node
/**
 * Injects every SKILL.md under the plugin's skills/ directory into context.
 *
 * Skills normally load only when Claude chooses to invoke them. These are
 * communication/engineering standards that must apply to every response, so
 * their full text is pushed into context instead of relying on invocation.
 *
 * Registered on SessionStart and SubagentStart. SessionStart's matcher includes
 * `compact`, which is what re-injects after a compaction drops the context —
 * PostCompact cannot do this, as it rejects `additionalContext` in its output
 * schema. SubagentStart covers spawned agents, which do not inherit the main
 * session's injected context.
 *
 * Skills are discovered by listing skills/, so adding skills/<name>/SKILL.md is
 * the only step needed to include a new one — this file never changes.
 *
 * A skill is SKIPPED when the same name already exists under the user's own
 * ~/.claude/skills/. That local copy takes precedence: the user may already
 * inject it from their own hook, and two skills sharing a name collide in the
 * skill registry regardless. The plugin never reads or writes the user's
 * settings.json to work this out — it only checks whether the directory exists.
 * Set DISCIPLINE_FORCE_INJECT=1 to inject regardless.
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
  'response and every task. Do not call the Skill tool for them - their full ' +
  'content is already here. They override default response and engineering ' +
  'behavior; explicit user instructions still win.\n';

// CLAUDE_PLUGIN_ROOT is set by Claude Code for plugin hooks; fall back to this
// file's parent so the script also works when run directly for testing.
const pluginRoot =
  process.env.CLAUDE_PLUGIN_ROOT || dirname(dirname(fileURLToPath(import.meta.url)));

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

// Honours CLAUDE_CONFIG_DIR for users who relocate ~/.claude.
const userSkillsDir = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'skills');

/** True when the user has their own copy of this skill, which then owns it. */
function ownedByUser(name) {
  if (process.env.DISCIPLINE_FORCE_INJECT === '1') return false;
  return existsSync(join(userSkillsDir, name, 'SKILL.md'));
}

function collectSkills() {
  const skillsDir = join(pluginRoot, 'skills');
  const names = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
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
