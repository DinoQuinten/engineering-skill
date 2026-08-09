import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PREAMBLE =
  'ALWAYS-ACTIVE SKILLS\n' +
  'The skills below are in force for this entire session. Apply them to every ' +
  'response and every task. Do not invoke them again - their full content is ' +
  'already here. They override default response and engineering ' +
  'behavior; explicit user instructions still win.\n';

const REQUIRED_SKILLS = ['engineering-discipline', 'response-discipline'];
const defaultSkillsRoot = fileURLToPath(new URL('../skills', import.meta.url));

function readRequiredSkills(skillsRoot) {
  return REQUIRED_SKILLS.map((name) => {
    const path = join(skillsRoot, name, 'SKILL.md');
    try {
      return readFileSync(path, 'utf8');
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
