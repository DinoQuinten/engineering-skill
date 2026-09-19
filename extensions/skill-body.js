import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repo-owned `skills/` directory, resolved from this module, not the caller. */
export const defaultSkillsRoot = fileURLToPath(new URL('../skills', import.meta.url));

/** Skills injected on every response, in the order hosts have always emitted. */
export const ALWAYS_ACTIVE_SKILLS = [
  'engineering-discipline',
  'response-discipline',
  'task-registry',
];

/** Header shared by every always-active injection (Pi, OpenCode, hook injector). */
export const PREAMBLE =
  'ALWAYS-ACTIVE SKILLS\n' +
  'The skills below are in force for this entire session. Apply them to every ' +
  'response and every task. Do not invoke them again - their full content is ' +
  'already here. They override default response and engineering ' +
  'behavior; explicit user instructions still win.\n';

/**
 * Drops the leading YAML frontmatter block from a skill body.
 *
 * `name` and `description` are how hosts discover and advertise a skill from
 * disk. They stay in the file; the injected copy needs neither. Only a block
 * starting on line 1 is removed, leaving any `---` rule inside the body alone.
 */
export function stripFrontmatter(body) {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/.exec(body);
  return match ? body.slice(match[0].length) : body;
}

/** Reads one skill body with frontmatter removed. Throws when it is unreadable. */
export function readSkillBody(skillsRoot, name) {
  return stripFrontmatter(readFileSync(join(skillsRoot, name, 'SKILL.md'), 'utf8'));
}

/**
 * Adapter-safe read. Host adapters must never break their host when a skill is
 * absent, so they degrade to an empty string instead of throwing.
 */
export function readSkillBodyOrEmpty(skillsRoot, name) {
  try {
    return readSkillBody(skillsRoot, name);
  } catch {
    return '';
  }
}

// @see docs-used.md#D13 — hosts that cannot confirm plan mode get this compact
// discovery hint instead of the full skill; explicit non-plan modes get nothing.
// @see docs-used.md#D14 — OpenCode 1.18.31 classic transform shape verified live.
export const PLANNING_REMINDER =
  'PLANNING-DISCIPLINE REMINDER\n' +
  'When you are planning or the user asks for a plan, invoke the ' +
  'planning-discipline skill and follow it before writing the plan.\n';

/**
 * Builds the always-active block: preamble plus every required skill body.
 * Returns an empty string when none can be read, so hosts inject nothing rather
 * than a bare preamble.
 */
export function buildAlwaysActiveBlock(skillsRoot = defaultSkillsRoot) {
  const bodies = ALWAYS_ACTIVE_SKILLS
    .map((name) => readSkillBodyOrEmpty(skillsRoot, name))
    .filter((body) => body !== '');
  return bodies.length > 0 ? PREAMBLE + '\n\n' + bodies.join('\n\n---\n\n') : '';
}

/**
 * Reminder variant that points at the skill file only when it actually exists.
 *
 * A relocated adapter can compute a path that no longer resolves; advertising a
 * dead path sends the model to a file it cannot read, which is worse than the
 * pathless reminder.
 */
export function planningReminder(skillPath) {
  return existsSync(skillPath)
    ? PLANNING_REMINDER + `Skill location: ${skillPath}\n`
    : PLANNING_REMINDER;
}
