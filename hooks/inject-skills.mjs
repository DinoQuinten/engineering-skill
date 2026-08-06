#!/usr/bin/env node
/**
 * SessionStart hook — injects every SKILL.md under the plugin's skills/ directory
 * into the session as additionalContext, making the skills always-active instead
 * of model-invoked.
 *
 * Skills are discovered by directory listing, so adding skills/<name>/SKILL.md is
 * the only step needed to include a new one — this file never changes.
 *
 * Contract: print a single JSON object on stdout, exit 0.
 * A hook failure must never break a session, so every error path exits 0 silently.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PREAMBLE = `ALWAYS-ACTIVE SKILLS
The skills below are in force for this entire session. Apply them to every response and every task. Do not call the Skill tool for them - their full content is already here. They override default response and engineering behavior; explicit user instructions still win.
`;

// CLAUDE_PLUGIN_ROOT is set by Claude Code for plugin hooks; fall back to this
// file's parent so the script also works when run directly for testing.
const pluginRoot =
  process.env.CLAUDE_PLUGIN_ROOT || dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(pluginRoot, 'skills');

function collectSkills() {
  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const bodies = [];
  for (const name of dirs) {
    try {
      bodies.push(readFileSync(join(skillsDir, name, 'SKILL.md'), 'utf8'));
    } catch {
      // Directory without a SKILL.md is not a skill — skip it.
    }
  }
  return bodies;
}

try {
  const bodies = collectSkills();
  if (bodies.length === 0) process.exit(0);

  const context = PREAMBLE + bodies.map((b) => `\n---\n\n${b.trim()}\n`).join('\n');

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context,
      },
    })
  );
} catch {
  // skills/ missing or unreadable — emit nothing rather than failing the session.
}

process.exit(0);
