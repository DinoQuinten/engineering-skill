import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const readme = readFileSync(join(repositoryRoot, 'README.md'), 'utf8');
const releaseTag = `v${JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')).version}`;

test('GitHub-facing copy describes a multi-host agentic plugin', () => {
  assert.match(readme, /^# Discipline$/m);
  assert.match(
    readme,
    /^> Always-active engineering standards for Codex, Claude Code, Pi, and OpenCode\.$/m,
  );
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
    const url = `${releaseTag}/skills/${skill}/SKILL.md`;
    assert.ok(readme.includes(url), `README must pin ${url}`);
  }
  assert.match(readme, /Upgrade all four URLs together/);
});

test('Pi install command pins the package release tag', () => {
  const command = `pi install git:github.com/DinoQuinten/engineering-skill@${releaseTag}`;
  assert.ok(readme.includes(command), `README must pin ${command}`);
});

test('OpenCode discovery uses one global Skills CLI command', () => {
  assert.match(
    readme,
    /^npx skills add DinoQuinten\/engineering-skill -g -a opencode -y$/m,
  );
});
