import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packagePath = join(repositoryRoot, 'package.json');
const extensionPath = join(repositoryRoot, 'extensions', 'always-active.js');
const canonicalDescription =
  'Always-active response, engineering, planning, and task-tracking standards for Codex, Claude Code, Pi, and OpenCode.';
const preamble =
  'ALWAYS-ACTIVE SKILLS\n' +
  'The skills below are in force for this entire session. Apply them to every ' +
  'response and every task. Do not invoke them again - their full content is ' +
  'already here. They override default response and engineering ' +
  'behavior; explicit user instructions still win.\n';

function occurrences(text, marker) {
  return text.split(marker).length - 1;
}

/** Mirrors the strip in extensions/always-active.js: frontmatter is disk-only metadata. */
function bodyOf(skillName) {
  const raw = readFileSync(join(repositoryRoot, 'skills', skillName, 'SKILL.md'), 'utf8');
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/.exec(raw);
  return match ? raw.slice(match[0].length) : raw;
}

async function loadExtension() {
  return import(`${pathToFileURL(extensionPath).href}?test=${Date.now()}`);
}

test('package manifest exposes the shared skills and native Pi extension', () => {
  const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));

  assert.equal(manifest.description, canonicalDescription);

  for (const directory of ['.codex-plugin', '.claude-plugin']) {
    const plugin = JSON.parse(readFileSync(join(repositoryRoot, directory, 'plugin.json'), 'utf8'));
    assert.equal(manifest.version, plugin.version, `${directory} version must match package.json`);
    assert.equal(plugin.description, canonicalDescription, `${directory} description must match`);
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

test('plugin discovery metadata uses the Discipline product name and canonical description', () => {
  const codex = JSON.parse(
    readFileSync(join(repositoryRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
  );
  const claudeMarketplace = JSON.parse(
    readFileSync(join(repositoryRoot, '.claude-plugin', 'marketplace.json'), 'utf8'),
  );

  assert.equal(codex.interface.displayName, 'Discipline');
  assert.equal(codex.interface.shortDescription, 'Always-active engineering standards');
  assert.equal(
    codex.interface.longDescription,
    'Keep response, engineering, and task-tracking rules active in every session, and apply planning discipline while plans are created or reviewed.',
  );
  assert.equal(claudeMarketplace.description, canonicalDescription);
  assert.equal(claudeMarketplace.plugins[0].description, canonicalDescription);
});

test('every shared skill has valid Codex discovery metadata', () => {
  for (const skill of [
    'response-discipline',
    'engineering-discipline',
    'task-registry',
    'planning-discipline',
  ]) {
    const metadata = readFileSync(
      join(repositoryRoot, 'skills', skill, 'agents', 'openai.yaml'),
      'utf8',
    );
    assert.match(metadata, /^interface:\r?$/m, `${skill} needs an interface object`);
    assert.match(metadata, /^  display_name: /m, `${skill} needs a display name`);
    assert.match(metadata, /^  short_description: /m, `${skill} needs a short description`);
    assert.match(metadata, /^  default_prompt: /m, `${skill} needs a default prompt`);
    assert.match(metadata, /^policy:\r?$/m, `${skill} needs invocation policy`);
    assert.match(metadata, /^  allow_implicit_invocation: true$/m);
  }
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

  assert.ok(result.systemPrompt.startsWith('BASE PROMPT'));
  assert.equal(result.message, undefined);
  assert.equal(occurrences(result.systemPrompt, preamble), 1);
  assert.equal(occurrences(result.systemPrompt, bodyOf('engineering-discipline')), 1);
  assert.equal(occurrences(result.systemPrompt, bodyOf('response-discipline')), 1);

  // Frontmatter stays on disk for host discovery and is dropped from the prompt.
  assert.doesNotMatch(result.systemPrompt, /^name: (response|engineering)-discipline$/m);
  assert.doesNotMatch(result.systemPrompt, /^description: /m);
  assert.match(result.systemPrompt, /^# Response Discipline$/m);
  assert.match(result.systemPrompt, /^# Engineering Discipline$/m);
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

test('Pi exposes the plan-only body for an official planner bridge', async () => {
  const extension = await loadExtension();
  const context = extension.getPlanningDisciplineInstructions();
  assert.match(context, /^# Planning Discipline$/m);
  assert.doesNotMatch(context, /^name: planning-discipline$/m);
});

test('Pi planner bridge degrades to empty when the skill is absent', async () => {
  const extension = await loadExtension();
  const missingRoot = mkdtempSync(join(tmpdir(), 'discipline-pi-plan-missing-'));

  try {
    assert.equal(extension.getPlanningDisciplineInstructions({ skillsRoot: missingRoot }), '');
  } finally {
    rmSync(missingRoot, { recursive: true, force: true });
  }
});

test('Pi always-active prompt carries the planning reminder once', async () => {
  const { PLANNING_REMINDER } = await import(
    `${pathToFileURL(join(repositoryRoot, 'extensions', 'skill-body.js')).href}?test=${Date.now()}`
  );
  const registered = new Map();
  const extension = await loadExtension();
  extension.default({ on: (eventName, handler) => registered.set(eventName, handler) });

  const result = await registered.get('before_agent_start')({ systemPrompt: 'BASE' }, {});
  assert.equal(occurrences(result.systemPrompt, PLANNING_REMINDER), 1);
});
