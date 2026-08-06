#!/usr/bin/env node
/**
 * Injects every SKILL.md under the plugin's skills/ directory into context.
 *
 * Skills normally load only when Claude chooses to invoke them. These are
 * communication/engineering standards that must apply to every response, so
 * their full text is pushed into context instead of relying on invocation.
 *
 * Registered on SessionStart and PostCompact — compaction drops injected
 * context, so it has to be re-emitted afterwards.
 *
 * Skills are discovered by listing skills/, so adding skills/<name>/SKILL.md is
 * the only step needed to include a new one — this file never changes.
 *
 * Fails silently (exit 0, no output) if the skills directory is missing, so a
 * broken plugin checkout never breaks session startup.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
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

function collectSkills() {
  const skillsDir = join(pluginRoot, 'skills');
  const names = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const bodies = [];
  for (const name of names) {
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
