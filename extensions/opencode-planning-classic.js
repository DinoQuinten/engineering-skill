import { join } from 'node:path';
import { defaultSkillsRoot, planningReminder } from './skill-body.js';

/**
 * OpenCode classic (V1) plugin. Add this file to the OpenCode plugin list.
 *
 * The classic system transform receives no agent identity, so it cannot tell
 * plan mode apart from a normal turn. It therefore adds only the compact
 * discovery reminder and the resolved skill path — instruction-based
 * activation. Use the v2 entrypoint (`opencode-planning.js`) for native
 * Plan-agent detection.
 *
 * @see docs-used.md#D13 — classic `experimental.chat.system.transform` shape.
 */
export default async function disciplinePlanningClassic() {
  const reminder = planningReminder(
    join(defaultSkillsRoot, 'planning-discipline', 'SKILL.md'),
  );

  return {
    'experimental.chat.system.transform': async (_input, output) => {
      if (!output.system.includes(reminder)) output.system.push(reminder);
    },
  };
}
