import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function stripFrontmatter(body) {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/.exec(body);
  return match ? body.slice(match[0].length) : body;
}

/**
 * @see docs-used.md#D12+�u���T OpenCode v2 context hooks expose the active agent.
 */
export function buildPlanningContext(skillsRoot = join(pluginRoot, 'skills')) {
  return stripFrontmatter(
    readFileSync(join(skillsRoot, 'planning-discipline', 'SKILL.md'), 'utf8'),
  );
}

/**
 * OpenCode v2 plugin. Add this file to the OpenCode plugin list.
 * The context hook runs for the agent loop and continuations.
 */
export default {
  id: 'discipline-planning',
  async setup(ctx) {
    const instructions = buildPlanningContext();
    await ctx.session.hook('context', (event) => {
      if (event.agent !== 'plan') return;
      event.system.push({ type: 'text', text: instructions });
    });
  },
};
