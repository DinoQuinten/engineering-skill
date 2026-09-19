import assert from 'node:assert/strict';
import test from 'node:test';
import disciplinePlugin from '../extensions/opencode-discipline.js';
import { buildAlwaysActiveBlock } from '../extensions/skill-body.js';

const build = () => disciplinePlugin();

test('always-active block carries the preamble and every required skill', async () => {
  const hooks = await build();
  const output = { system: ['BASE'] };
  await hooks['experimental.chat.system.transform']({ sessionID: 's1' }, output);

  assert.equal(output.system.length, 2);
  const block = output.system[1];
  assert.match(block, /^ALWAYS-ACTIVE SKILLS$/m);
  assert.match(block, /^# Engineering Discipline$/m);
  assert.match(block, /^# Response Discipline$/m);
  assert.match(block, /^# Task Registry$/m);
  assert.doesNotMatch(block, /^name:/m);
});

test('planning-discipline is not injected for a non-plan agent', async () => {
  const hooks = await build();
  await hooks['chat.message']({ sessionID: 's2', agent: undefined });

  const output = { system: ['BASE'] };
  await hooks['experimental.chat.system.transform']({ sessionID: 's2' }, output);

  assert.equal(output.system.length, 2);
  assert.doesNotMatch(output.system.join('\n'), /^# Planning Discipline$/m);
});

test('planning-discipline is injected for the plan agent', async () => {
  const hooks = await build();
  await hooks['chat.message']({ sessionID: 's3', agent: 'plan' });

  const output = { system: ['BASE'] };
  await hooks['experimental.chat.system.transform']({ sessionID: 's3' }, output);

  assert.equal(output.system.length, 3);
  assert.match(output.system.join('\n'), /^# Planning Discipline$/m);
});

test('one system build never receives a block twice', async () => {
  const hooks = await build();
  await hooks['chat.message']({ sessionID: 's4', agent: 'plan' });

  const output = { system: ['BASE'] };
  await hooks['experimental.chat.system.transform']({ sessionID: 's4' }, output);
  await hooks['experimental.chat.system.transform']({ sessionID: 's4' }, output);

  assert.equal(output.system.length, 3);
});

test('session.deleted stops tracking the agent', async () => {
  const hooks = await build();
  await hooks['chat.message']({ sessionID: 's5', agent: 'plan' });
  await hooks.event({ event: { type: 'session.deleted', properties: { sessionID: 's5' } } });

  const output = { system: ['BASE'] };
  await hooks['experimental.chat.system.transform']({ sessionID: 's5' }, output);

  assert.equal(output.system.length, 2);
});

test('a missing skills root yields no block instead of throwing', () => {
  assert.equal(buildAlwaysActiveBlock('does-not-exist'), '');
});
