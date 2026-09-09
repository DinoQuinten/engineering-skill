#!/usr/bin/env node
/**
 * Mirrors the repository's SKILL.md files into the user's personal skills
 * directory, making the repo the single authoritative copy.
 *
 * WHY THIS EXISTS. `ownedByUser()` in hooks/inject-skills.mjs skips any plugin
 * skill the user also has under their own skills directory, so the personal copy
 * silently wins. Hand-editing both produced two forks of response-discipline and
 * engineering-discipline that drifted in opposite directions. The repo is now the
 * only place skills are written; this script regenerates the personal copies from
 * it, so no edit is ever made in two places.
 *
 * ONLY EXISTING NAMES ARE MIRRORED. A repo skill with no counterpart under the
 * user's directory is skipped, never created — otherwise adding a skill here would
 * silently make it always-active on someone's machine via their own hook.
 *
 * `--check` writes nothing and exits 1 on any drift, which catches a hand-edit of
 * the mirror before a release ships from a repo that no longer matches it.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(repositoryRoot, 'skills');

// Same resolution as hooks/inject-skills.mjs `userSkillsDir`: Codex keeps personal
// skills under ~/.agents/skills, Claude Code under ${CLAUDE_CONFIG_DIR:-~/.claude}.
const isCodex = Boolean(process.env.PLUGIN_ROOT);
const userSkillsDir = isCodex
  ? join(homedir(), '.agents', 'skills')
  : join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'skills');

const checkOnly = process.argv.includes('--check');

function repositorySkillNames() {
  try {
    return readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => existsSync(join(skillsDir, name, 'SKILL.md')))
      .sort();
  } catch {
    return [];
  }
}

const results = { copied: [], unchanged: [], drifted: [], skipped: [] };

for (const name of repositorySkillNames()) {
  const target = join(userSkillsDir, name, 'SKILL.md');
  if (!existsSync(target)) {
    results.skipped.push({ name, reason: 'no personal copy — the plugin hook owns this skill' });
    continue;
  }

  const source = join(skillsDir, name, 'SKILL.md');
  const wanted = readFileSync(source, 'utf8');
  const current = readFileSync(target, 'utf8');

  if (wanted === current) {
    results.unchanged.push({ name, bytes: Buffer.byteLength(wanted) });
    continue;
  }

  if (checkOnly) {
    results.drifted.push({ name, target, repoBytes: Buffer.byteLength(wanted), mirrorBytes: Buffer.byteLength(current) });
    continue;
  }

  writeFileSync(target, wanted, 'utf8');
  results.copied.push({ name, target, bytes: Buffer.byteLength(wanted), was: Buffer.byteLength(current) });
}

console.log(`user skills directory: ${userSkillsDir}`);
for (const { name, bytes, was } of results.copied) {
  console.log(`  synced    ${name}  ${was} -> ${bytes} bytes`);
}
for (const { name, bytes } of results.unchanged) {
  console.log(`  current   ${name}  ${bytes} bytes`);
}
for (const { name, reason } of results.skipped) {
  console.log(`  skipped   ${name}  (${reason})`);
}
for (const { name, repoBytes, mirrorBytes, target } of results.drifted) {
  console.error(`  DRIFT     ${name}  repo ${repoBytes} bytes vs mirror ${mirrorBytes} bytes`);
  console.error(`            ${target}`);
}

if (results.drifted.length > 0) {
  console.error(`\n${results.drifted.length} skill(s) differ from the repo. Run \`npm run sync\` to regenerate the mirror.`);
  process.exit(1);
}

process.exit(0);
