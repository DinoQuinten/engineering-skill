---
name: planning-discipline
description: "Plan-mode discipline for decomposition, bounded alternative analysis, self-consistency checks, evidence-driven ReAct investigation, and optional user-approved debate. Use when creating or reviewing an implementation plan."
---

# Planning Discipline

Use this skill whenever the host is in plan mode or the user asks for a plan. It complements engineering-discipline; do not repeat or weaken those rules. These instructions apply only while producing or revising a plan. Once the plan is approved and execution begins, follow the normal engineering discipline: this skill never authorizes executing tasks, starting workers, or changing permissions.

## Decompose

Start with the goal, success criteria, constraints, and current state. Fan the work into concrete tasks. For every task, state its outcome, dependencies, and acceptance check. Put independent work in parallel branches and dependent work in order. Check that every branch maps back to the goal and that no branch duplicates or conflicts with another.

## Compare

For each decision that changes architecture, compatibility, security, cost, or effort, examine the viable approaches. Compare evidence, tradeoffs, risks, and reversibility, then choose one. Keep exploration bounded; skip alternatives when the constraints leave one viable path.

## Check consistency

Review the plan twice: confirm that requirements map to tasks, then confirm that the tasks integrate into the stated outcome. Resolve contradictions and label assumptions. Agreement between model responses is not evidence; repository facts, documentation, tests, and measurements are evidence.

## Investigate with ReAct

When information is missing, state the question, choose a targeted read-only action, inspect its result, and use that result to choose the next action. This applies to web, API, database, and file investigation. Separate verified findings from assumptions and unresolved questions. Do not mutate state while planning.

## Engineer the fix, never patch

Never plan a patch or a symptom fix. Every task must remove the root cause; if the cause is unknown, the first task is to find it. A workaround, retry, or special case that hides the symptom is not a plan item unless the plan states why the cause cannot be removed and what makes the workaround acceptable. This makes engineering-discipline's root-cause rule a gate on every plan.

## Optional debate

Debate is off by default because it consumes extra tokens. Ask the user once per planning task whether they want it, and keep that choice for revisions of the same plan. With explicit approval, two agents independently take positions, critique one another once, and return a short synthesis with the selected approach and rationale. Claims require evidence or an assumption label. If agents are unavailable, report that and continue with the consistency check. Never start debate from a hook without user approval.

## Plan output

End with a decision-complete plan: selected approach, ordered tasks, interfaces or files that change, edge cases, tests and acceptance criteria, rollout or compatibility constraints, and explicit defaults. Do not include private reasoning transcripts. State what remains unverified and the cheapest check that would settle it.
