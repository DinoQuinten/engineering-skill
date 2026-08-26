---
name: task-registry
description: "Append-only work registry (registry.jsonl, git-tracked) recording every task any agent, sub-agent, or worker job performs — including no-diff work like audits, RCA, and decisions. Use at the START of any session or multi-step task in a repo containing registry.jsonl (read it first), when SPAWNING or acting as a sub-agent, when COMPLETING, FAILING, or ABANDONING any task, and whenever work produces a finding or decision without a code change. Ensures the next agent inherits what was done, what was found, and why."
---

# Task Registry

One `registry.jsonl` at the repo root. Every task by every agent, sub-agent, or worker job gets entries. Git-tracked — committed together with the work it describes.

## Why

Git captures what changed. It loses work with no diff: audits, verification runs, RCA findings, decisions, abandoned approaches. The registry captures task state and outcomes so the next agent reads one file instead of reconstructing history.

## Rules

1. **Session start**: if `registry.jsonl` exists, read the last ~30 lines before the first action. Active entries from other agents = work in flight; don't duplicate or collide with it.
2. **Task start**: append an `active` line before beginning work.
3. **Task end**: append a `done` / `failed` / `abandoned` line. Always include `outcome` — one sentence, the finding or result. Failed/abandoned entries state the reason; they are as valuable as done ones.
4. **Progress lines** (long tasks): append a `progress` line at objective milestones — a commit made, a phase completed, a blocking finding, a decision taken. Never on a timer. Each line must state new information; repeating the last line is noise.
5. **No-diff work still registers**: audits, RCA, decisions, verification runs get entries with `"commits":[]` and the finding in `outcome`.
6. **Commit linkage**: completion lines list the commit SHAs of the work. Commit the registry change in the same commit as the work it describes.
7. **Append only**: never edit or delete existing lines. Corrections are new lines referencing the same `id`.
8. **One file**: no per-workstream splits. Rotate to `registry-YYYY-MM.jsonl` only if reads become slow.

## Line schema

One JSON object per line. Fixed keys, no nesting:

```jsonl
{"id":"T-20260806-1231-idx-audit","ts":"2026-08-06T12:31:00Z","agent":"sub-idx","task":"fpd covering index audit","status":"active"}
{"id":"T-20260806-1231-idx-audit","ts":"2026-08-06T13:02:00Z","status":"done","commits":["a3f9c2e"],"outcome":"idx unused (50 scans in window vs 197M on neighbor); drop decision deferred pending 1 day of worker traffic"}
```

- `id`: `T-YYYYMMDD-HHMM-<slug>` — timestamp-based, collision-free across parallel agents, no coordination needed.
- `agent`: agent/worker name on the `active` line (`main`, `sub-idx`, `worker:bing-sync`).
- `status`: `active` | `progress` | `done` | `failed` | `abandoned`.
- `commits`: SHAs of the work; `[]` for no-diff tasks.
- `outcome`: required on every terminal line. One sentence. A finding, a result, or a failure reason.

## Reading it

```bash
tail -30 registry.jsonl                                  # session start
grep '"status":"active"' registry.jsonl                  # work in flight
jq -r 'select(.status=="done") | .outcome' registry.jsonl # findings feed
```
