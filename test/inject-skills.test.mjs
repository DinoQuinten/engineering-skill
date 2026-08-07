import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const hookPath = join(repositoryRoot, 'hooks', 'inject-skills.mjs');
const temporaryDirectories = [];

function temporaryDirectory(label) {
  const path = mkdtempSync(join(tmpdir(), `discipline-${label}-`));
  temporaryDirectories.push(path);
  return path;
}

function writeSkill(root, name, marker = name) {
  const skillDirectory = join(root, 'skills', name);
  mkdirSync(skillDirectory, { recursive: true });
  writeFileSync(
    join(skillDirectory, 'SKILL.md'),
    `---\nname: ${name}\ndescription: Test fixture\n---\n\n# ${marker}\n`,
    'utf8',
  );
}

function markUserOwned(userRoot, host, name, claudeConfigDirectory) {
  const skillsRoot = host === 'codex'
    ? join(userRoot, '.agents', 'skills')
    : join(claudeConfigDirectory ?? join(userRoot, '.claude'), 'skills');
  const skillDirectory = join(skillsRoot, name);
  mkdirSync(skillDirectory, { recursive: true });
  writeFileSync(join(skillDirectory, 'SKILL.md'), '# User-owned fixture\n', 'utf8');
}

function runHook({
  pluginRoot,
  claudePluginRoot,
  host = 'codex',
  userRoot,
  claudeConfigDirectory,
  only,
  event = 'SessionStart',
  force = false,
}) {
  const args = [hookPath];
  if (only !== undefined) args.push('--only', only);

  const env = { ...process.env };
  delete env.PLUGIN_ROOT;
  delete env.CLAUDE_PLUGIN_ROOT;
  delete env.CLAUDE_CONFIG_DIR;
  delete env.DISCIPLINE_FORCE_INJECT;

  if (host === 'codex') env.PLUGIN_ROOT = pluginRoot;
  if (claudePluginRoot !== undefined) env.CLAUDE_PLUGIN_ROOT = claudePluginRoot;
  if (host === 'claude') env.CLAUDE_PLUGIN_ROOT = claudePluginRoot ?? pluginRoot;
  if (claudeConfigDirectory !== undefined) env.CLAUDE_CONFIG_DIR = claudeConfigDirectory;
  if (force) env.DISCIPLINE_FORCE_INJECT = '1';
  if (userRoot !== undefined) {
    env.HOME = userRoot;
    env.USERPROFILE = userRoot;
  }

  return spawnSync(process.execPath, args, {
    cwd: repositoryRoot,
    env,
    input: JSON.stringify({ hook_event_name: event }),
    encoding: 'utf8',
  });
}

function parseOutput(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout === '' ? null : JSON.parse(result.stdout);
}

test.after(() => {
  for (const path of temporaryDirectories) {
    rmSync(path, { recursive: true, force: true });
  }
});

test('Codex prefers native PLUGIN_ROOT over the Claude compatibility alias', () => {
  const codexRoot = temporaryDirectory('codex-root');
  const compatibilityRoot = temporaryDirectory('compat-root');
  const userRoot = temporaryDirectory('user-root');
  writeSkill(codexRoot, 'response-discipline', 'NATIVE CODEX ROOT');
  writeSkill(compatibilityRoot, 'response-discipline', 'COMPATIBILITY ROOT');

  const output = parseOutput(runHook({
    pluginRoot: codexRoot,
    claudePluginRoot: compatibilityRoot,
    userRoot,
    only: 'response-discipline',
  }));

  assert.match(output.hookSpecificOutput.additionalContext, /NATIVE CODEX ROOT/);
  assert.doesNotMatch(output.hookSpecificOutput.additionalContext, /COMPATIBILITY ROOT/);
});

test('Codex defers to a user-owned skill under ~/.agents/skills', () => {
  const pluginRoot = temporaryDirectory('codex-plugin');
  const userRoot = temporaryDirectory('codex-user');
  writeSkill(pluginRoot, 'response-discipline');
  markUserOwned(userRoot, 'codex', 'response-discipline');

  const output = parseOutput(runHook({
    pluginRoot,
    userRoot,
    only: 'response-discipline',
  }));

  assert.equal(output, null);
});

test('Claude defers to a user-owned skill under CLAUDE_CONFIG_DIR', () => {
  const pluginRoot = temporaryDirectory('claude-plugin');
  const userRoot = temporaryDirectory('claude-user');
  const configRoot = temporaryDirectory('claude-config');
  writeSkill(pluginRoot, 'engineering-discipline');
  markUserOwned(userRoot, 'claude', 'engineering-discipline', configRoot);

  const output = parseOutput(runHook({
    host: 'claude',
    pluginRoot,
    userRoot,
    claudeConfigDirectory: configRoot,
    only: 'engineering-discipline',
  }));

  assert.equal(output, null);
});

test('force injection overrides user ownership on both hosts', () => {
  for (const host of ['codex', 'claude']) {
    const pluginRoot = temporaryDirectory(`${host}-force-plugin`);
    const userRoot = temporaryDirectory(`${host}-force-user`);
    const configRoot = host === 'claude' ? temporaryDirectory('force-config') : undefined;
    writeSkill(pluginRoot, 'response-discipline', `${host.toUpperCase()} FORCE`);
    markUserOwned(userRoot, host, 'response-discipline', configRoot);

    const output = parseOutput(runHook({
      host,
      pluginRoot,
      userRoot,
      claudeConfigDirectory: configRoot,
      only: 'response-discipline',
      force: true,
    }));

    assert.match(output.hookSpecificOutput.additionalContext, new RegExp(`${host.toUpperCase()} FORCE`));
  }
});

test('the requested skill is emitted and the incoming event name is preserved', () => {
  const pluginRoot = temporaryDirectory('only-plugin');
  const userRoot = temporaryDirectory('only-user');
  writeSkill(pluginRoot, 'engineering-discipline', 'ENGINEERING ONLY');
  writeSkill(pluginRoot, 'response-discipline', 'RESPONSE OMITTED');

  const output = parseOutput(runHook({
    pluginRoot,
    userRoot,
    only: 'engineering-discipline',
    event: 'SubagentStart',
  }));

  assert.equal(output.hookSpecificOutput.hookEventName, 'SubagentStart');
  assert.match(output.hookSpecificOutput.additionalContext, /ENGINEERING ONLY/);
  assert.doesNotMatch(output.hookSpecificOutput.additionalContext, /RESPONSE OMITTED/);
});

test('no --only argument emits every skill in stable name order', () => {
  const pluginRoot = temporaryDirectory('all-plugin');
  const userRoot = temporaryDirectory('all-user');
  writeSkill(pluginRoot, 'response-discipline', 'SECOND SKILL');
  writeSkill(pluginRoot, 'engineering-discipline', 'FIRST SKILL');

  const output = parseOutput(runHook({ pluginRoot, userRoot }));
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.indexOf('FIRST SKILL') < context.indexOf('SECOND SKILL'));
  assert.match(context, /\n\n---\n\n/);
});

test('unknown skills and missing skill directories produce no output', () => {
  const pluginRoot = temporaryDirectory('unknown-plugin');
  const missingRoot = temporaryDirectory('missing-plugin');
  const userRoot = temporaryDirectory('unknown-user');
  writeSkill(pluginRoot, 'response-discipline');

  assert.equal(parseOutput(runHook({
    pluginRoot,
    userRoot,
    only: 'not-a-skill',
  })), null);
  assert.equal(parseOutput(runHook({ pluginRoot: missingRoot, userRoot })), null);
});
