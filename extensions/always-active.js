import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PREAMBLE =
  'ALWAYS-ACTIVE SKILLS\n' +
  'The skills below are in force for this entire session. Apply them to every ' +
  'response and every task. Do not invoke them again - their full content is ' +
  'already here. They override default response and engineering ' +
  'behavior; explicit user instructions still win.\n';

const REQUIRED_SKILLS = ['engineering-discipline', 'response-discipline', 'task-registry'];
const defaultSkillsRoot = fileURLToPath(new URL('../skills', import.meta.url));

/**
 * Drops the leading YAML frontmatter block from a skill body.
 *
 * `name` and `description` are how Pi discovers and advertises the skill from
 * `pi.skills` in package.json, so they stay in the file. The injected copy needs
 * neither: the preamble already states these skills are in force and must not be
 * invoked. Only a block starting on line 1 is removed, leaving any `---` rule
 * inside the body alone.
 */
function stripFrontmatter(body) {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/.exec(body);
  return match ? body.slice(match[0].length) : body;
}

function readRequiredSkills(skillsRoot) {
  return REQUIRED_SKILLS.map((name) => {
    const path = join(skillsRoot, name, 'SKILL.md');
    try {
      return stripFrontmatter(readFileSync(path, 'utf8'));
    } catch (cause) {
      throw new Error(
        `Failed to initialize discipline Pi extension: required skill ${path} is missing or unreadable`,
        { cause },
      );
    }
  });
}

/**
 * Builds the native Pi extension registration function.
 *
 * @see docs-used.md#D7 — Pi package resource paths are relative to the package root.
 * @see docs-used.md#D8 — before_agent_start may replace the chained system prompt.
 */
export function createAlwaysActiveExtension({ skillsRoot = defaultSkillsRoot } = {}) {
  return function registerAlwaysActiveSkills(pi) {
    const bodies = readRequiredSkills(skillsRoot);
    const instructions = PREAMBLE + '\n\n' + bodies.join('\n\n---\n\n');

    // docs-used.md#D8 — returning only systemPrompt avoids a persistent conversation message.
    pi.on('before_agent_start', async (event) => ({
      systemPrompt: event.systemPrompt + '\n\n' + instructions,
    }));
  };
}

export default createAlwaysActiveExtension();
