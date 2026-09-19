import { defaultSkillsRoot, readSkillBodyOrEmpty } from './skill-body.js';

/**
 * OpenCode v2 plugin. Add this file to the OpenCode plugin list.
 *
 * The `context` hook runs for the agent loop and its tool-driven
 * continuations, and exposes the active agent, so the full skill is appended
 * only for the Plan agent. An empty body (missing skill) makes the plugin a
 * no-op rather than a load failure.
 *
 * @see docs-used.md#D13 — OpenCode v2 context hooks expose the active agent.
 */
export function buildPlanningContext(skillsRoot = defaultSkillsRoot) {
  return readSkillBodyOrEmpty(skillsRoot, 'planning-discipline');
}

export default {
  id: 'discipline-planning',
  async setup(ctx) {
    const instructions = buildPlanningContext();
    if (!instructions) return;
    await ctx.session.hook('context', (event) => {
      if (event.agent !== 'plan') return;
      const alreadyPresent = event.system.some(
        (part) => part && part.type === 'text' && part.text === instructions,
      );
      if (!alreadyPresent) event.system.push({ type: 'text', text: instructions });
    });
  },
};
