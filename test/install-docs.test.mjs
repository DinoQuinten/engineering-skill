import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const readme = readFileSync(join(repositoryRoot, 'README.md'), 'utf8');

test('GitHub-facing copy describes a multi-host agentic plugin', () => {
  assert.match(readme, /^# Agentic discipline for Codex, Claude Code, Pi, and OpenCode$/m);
  assert.doesNotMatch(readme, /Claude Code plugin: always-active response and engineering discipline skills/);
});

test('Pi local installation works from the cloned repository', () => {
  assert.match(readme, /^pi install \.$/m);
});

test('OpenCode instructions automatically load all four skills', () => {
  for (const skill of [
    'response-discipline',
    'engineering-discipline',
    'task-registry',
    'planning-discipline',
  ]) {
    assert.match(readme, new RegExp(`v1\\.9\\.0/skills/${skill}/SKILL\\.md`));
  }
  assert.match(readme, /Upgrade all four URLs together/);
});

test('OpenCode discovery uses one global Skills CLI command', () => {
  assert.match(
    readme,
    /^npx skills add DinoQuinten\/engineering-skill -g -a opencode -y$/m,
  );
});
