import { join } from 'node:path';
import {
  ALWAYS_ACTIVE_SKILLS,
  PLANNING_REMINDER,
  PREAMBLE,
  defaultSkillsRoot,
  readSkillBody,
  readSkillBodyOrEmpty,
} from './skill-body.js';

const REQUIRED_SKILLS = ALWAYS_ACTIVE_SKILLS;

function readRequiredSkills(skillsRoot) {
  return REQUIRED_SKILLS.map((name) => {
    const path = join(skillsRoot, name, 'SKILL.md');
    try {
      return readSkillBody(skillsRoot, name);
    } catch (cause) {
      throw new Error(
        `Failed to initialize discipline Pi extension: required skill ${path} is missing or unreadable`,
        { cause },
      );
    }
  });
}

/**
 * Reads the plan-only body for the official Pi planner's live enabled branch.
 * Returns an empty string when the skill is absent so a planner bridge cannot
 * break the host.
 *
 * @see docs-used.md#D13 — Pi has no universal cross-extension plan-state API.
 */
export function getPlanningDisciplineInstructions({ skillsRoot = defaultSkillsRoot } = {}) {
  return readSkillBodyOrEmpty(skillsRoot, 'planning-discipline');
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
    const instructions =
      PREAMBLE + '\n\n' + bodies.join('\n\n---\n\n') + '\n\n' + PLANNING_REMINDER;

    // docs-used.md#D8 — returning only systemPrompt avoids a persistent conversation message.
    pi.on('before_agent_start', async (event) => ({
      systemPrompt: event.systemPrompt + '\n\n' + instructions,
    }));
  };
}

export default createAlwaysActiveExtension();
