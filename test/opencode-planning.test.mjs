import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildPlanningContext } from '../extensions/opencode-planning.js';
import classicPlugin from '../extensions/opencode-planning-classic.js';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test('OpenCode planning adapter exposes the plan skill without frontmatter', () => {
  const context = buildPlanningContext();
  assert.match(context, /^# Planning Discipline$/m);
  assert.doesNotMatch(context, /^description:/m);
});

test('OpenCode planning adapter is a no-op when the skill is missing', () => {
  assert.equal(buildPlanningContext('does-not-exist'), '');
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

test('OpenCode planning adapter does not append a duplicate block', async () => {
  const registered = {};
  const plugin = (await import('../extensions/opencode-planning.js')).default;
  await plugin.setup({
    session: { hook: async (name, handler) => (registered[name] = handler) },
  });

  const event = { agent: 'plan', system: [] };
  await registered.context(event);
  await registered.context(event);
  assert.equal(event.system.length, 1);
});

test('OpenCode classic adapter adds the reminder and resolved skill path once', async () => {
  const hooks = await classicPlugin();
  const output = { system: ['BASE PROMPT'] };
  await hooks['experimental.chat.system.transform']({}, output);
  await hooks['experimental.chat.system.transform']({}, output);

  assert.equal(output.system.length, 2);
  assert.match(output.system[1], /planning-discipline/i);
  assert.match(output.system[1], /skills[\\/]planning-discipline[\\/]SKILL\.md/);
});

test('planning reminder never advertises a skill path that does not exist', async () => {
  const { planningReminder } = await import('../extensions/skill-body.js');

  const dead = planningReminder('C:/definitely/not/here/SKILL.md');
  assert.doesNotMatch(dead, /definitely/, 'a missing path must not be advertised');
  assert.match(dead, /planning-discipline/i);

  const live = planningReminder(
    join(repositoryRoot, 'skills', 'planning-discipline', 'SKILL.md'),
  );
  assert.match(live, /SKILL\.md/);
});
