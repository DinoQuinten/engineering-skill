import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packagePath = join(repositoryRoot, 'package.json');
const extensionPath = join(repositoryRoot, 'extensions', 'always-active.js');
const preamble =
  'ALWAYS-ACTIVE SKILLS\n' +
  'The skills below are in force for this entire session. Apply them to every ' +
  'response and every task. Do not invoke them again - their full content is ' +
  'already here. They override default response and engineering ' +
  'behavior; explicit user instructions still win.\n';

function occurrences(text, marker) {
  return text.split(marker).length - 1;
}

async function loadExtension() {
  return import(`${pathToFileURL(extensionPath).href}?test=${Date.now()}`);
}

test('package manifest exposes the shared skills and native Pi extension', () => {
  const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));

  for (const directory of ['.codex-plugin', '.claude-plugin']) {
    const plugin = JSON.parse(readFileSync(join(repositoryRoot, directory, 'plugin.json'), 'utf8'));
    assert.equal(manifest.version, plugin.version, `${directory} version must match package.json`);
  }
  assert.equal(manifest.type, 'module');
  assert.equal(manifest.private, true);
  assert.ok(manifest.keywords.includes('pi-package'));
  assert.deepEqual(manifest.pi, {
    skills: ['./skills'],
    extensions: ['./extensions/always-active.js'],
  });
  assert.equal(manifest.dependencies, undefined);
});

test('public Pi extension preserves the base prompt and injects each required body once', async () => {
  const registered = new Map();
  const pi = {
    on(eventName, handler) {
      registered.set(eventName, handler);
    },
  };
  const extension = await loadExtension();
  extension.default(pi);

  assert.deepEqual([...registered.keys()], ['before_agent_start']);

  const result = await registered.get('before_agent_start')({ systemPrompt: 'BASE PROMPT' }, {});
  const engineering = readFileSync(
    join(repositoryRoot, 'skills', 'engineering-discipline', 'SKILL.md'),
    'utf8',
  );
  const response = readFileSync(
    join(repositoryRoot, 'skills', 'response-discipline', 'SKILL.md'),
    'utf8',
  );

  assert.ok(result.systemPrompt.startsWith('BASE PROMPT'));
  assert.equal(result.message, undefined);
  assert.equal(occurrences(result.systemPrompt, preamble), 1);
  assert.equal(occurrences(result.systemPrompt, engineering), 1);
  assert.equal(occurrences(result.systemPrompt, response), 1);
});

test('each before_agent_start handler call injects exactly one fresh copy', async () => {
  const registered = new Map();
  const extension = await loadExtension();
  extension.default({ on: (eventName, handler) => registered.set(eventName, handler) });
  const handler = registered.get('before_agent_start');

  const first = await handler({ systemPrompt: 'FIRST' }, {});
  const second = await handler({ systemPrompt: 'SECOND' }, {});

  assert.equal(occurrences(first.systemPrompt, preamble), 1);
  assert.equal(occurrences(second.systemPrompt, preamble), 1);
});

test('extension initialization reports an unreadable required skill clearly', async () => {
  const extension = await loadExtension();
  const missingRoot = mkdtempSync(join(tmpdir(), 'discipline-pi-missing-'));

  try {
    assert.throws(
      () => extension.createAlwaysActiveExtension({ skillsRoot: missingRoot })({ on() {} }),
      /Failed to initialize discipline Pi extension: required skill .*engineering-discipline.*SKILL\.md.*unreadable/i,
    );
  } finally {
    rmSync(missingRoot, { recursive: true, force: true });
  }
});
