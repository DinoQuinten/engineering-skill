import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPlanningContext } from '../extensions/opencode-planning.js';

test('OpenCode planning adapter exposes the plan skill without frontmatter', () => {
  const context = buildPlanningContext();
  assert.match(context, /^# Planning Discipline$/m);
  assert.doesNotMatch(context, /^description:/m);
});

test('OpenCode planning adapter only mutates system context for the Plan agent', async () => {
  const registered = {};
  const plugin = (await import('../extensions/opencode-planning.js')).default;
  await plugin.setup({
    session: {
      hook: async (name, handler) => {
        registered[name] = handler;
      },
    },
  });

  const plan = { agent: 'plan', system: [] };
  const build = { agent: 'build', system: [] };
  await registered.context(plan);
  await registered.context(build);
  assert.equal(plan.system.length, 1);
  assert.equal(build.system.length, 0);
});
