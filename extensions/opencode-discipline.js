import {
  buildAlwaysActiveBlock,
  defaultSkillsRoot,
  readSkillBodyOrEmpty,
} from './skill-body.js';

const ALWAYS_MARKER = 'ALWAYS-ACTIVE SKILLS';
const PLANNING_MARKER = '# Planning Discipline';

function pushOnce(system, marker, block) {
  if (!block) return;
  if (system.some((part) => typeof part === 'string' && part.includes(marker))) return;
  system.push(block);
}

/**
 * OpenCode classic (V1) plugin. Add this file and `skill-body.js` to the
 * OpenCode plugin directory (`~/.config/opencode/plugin/`) and every discipline
 * skill loads itself — no `instructions` entries required.
 *
 * Always-active skills are appended to every system build. `planning-discipline`
 * is appended only while the Plan agent is active. The classic system transform
 * carries no agent identity, so the active agent is tracked from `chat.message`,
 * which fires for each user turn before the system prompt is assembled.
 *
 * @see docs-used.md#D14 — hook order and agent fields verified on OpenCode 1.18.31.
 */
export default async function disciplinePlugin() {
  const always = buildAlwaysActiveBlock(defaultSkillsRoot);
  const planning = readSkillBodyOrEmpty(defaultSkillsRoot, 'planning-discipline');
  const agentBySession = new Map();

  return {
    event: async ({ event }) => {
      if (event?.type !== 'session.deleted') return;
      const sessionID = event.properties?.sessionID ?? event.properties?.info?.id;
      if (sessionID) agentBySession.delete(sessionID);
    },

    'chat.message': async (input) => {
      if (input?.sessionID) agentBySession.set(input.sessionID, input.agent);
    },

    'experimental.chat.system.transform': async (input, output) => {
      pushOnce(output.system, ALWAYS_MARKER, always);
      const agent = input?.sessionID ? agentBySession.get(input.sessionID) : undefined;
      if (agent === 'plan') pushOnce(output.system, PLANNING_MARKER, planning);
    },
  };
}
