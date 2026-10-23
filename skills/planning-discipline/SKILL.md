---
name: planning-discipline
description: "Create or review implementation plans with task decomposition, evidence-based choices, consistency checks, and optional user-approved debate."
---

# Planning Discipline

- Apply in plan mode or when the user requests a plan, across all hosts.
- Follow engineering-discipline. Use available read-only tools; do not mutate state while planning.
- This skill does not authorize execution, workers, or permission changes. Its scope ends when execution begins.

## Decompose

- Define the goal, success criteria, constraints, and current state.
- Give each task an outcome, dependencies, and an acceptance check.
- Order dependencies; identify independent tasks for parallel work. Remove duplicate, conflicting, or unrelated tasks.

## Compare approaches

- Compare viable options for decisions affecting architecture, compatibility, security, cost, or effort.
- Use evidence, tradeoffs, risks, and reversibility. Bound exploration; skip comparison when only one option meets the constraints.
- Untested means unexplored. Keep untested options open; reject them only when evidence shows failure or a constraint violation.
- Test untested options that could change the choice, using read-only checks while planning.
- Choose the best-engineered option for current requirements and known future needs; cost alone must not decide.

## Check consistency

- Review both directions: requirements map to tasks; combined tasks deliver the goal.
- Resolve contradictions and label assumptions.
- Use repository facts, documentation, tests, and measurements as evidence. Agreement between models proves nothing.

## Investigate

- For each unknown, state the question, run a targeted read-only check, and inspect the result before choosing the next check.
- Separate verified findings, assumptions, and unresolved questions.

## Fix the cause

- For a defect, plan to remove its root cause. If unknown, investigate the cause first.
- Include a workaround only when the plan explains why the cause cannot be removed and why the workaround is acceptable.

## Optional debate

- Debate is off by default. Ask once per planning task and retain the choice through revisions.
- With explicit approval, use two agents: independent positions, one mutual critique, then a short synthesis of the choice and rationale.
- Require evidence or assumption labels. If agents are unavailable, report this and use the consistency check.
- Hooks must never start debate without user approval.

## Plan output

- State the chosen approach, ordered tasks, affected files or interfaces, edge cases, tests, acceptance criteria, rollout constraints, compatibility, and defaults.
- Include unresolved checks with the smallest sufficient verification step. Defer checks requiring changes until authorized execution.
- Omit private reasoning transcripts.
