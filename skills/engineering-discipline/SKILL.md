---
name: engineering-discipline
description: "Engineering practice for ANY coding, design, or documentation task: docs-first over training memory (with a docs-used.md ledger and @see references), minimal code via the YAGNI ladder, engineered root-cause fixes (never symptom patches), business-behavior-driven API/schema design, behavior-level testing, executed verification with blast-radius checks before destructive operations, event logging, DRY, and no-blob docs. Use whenever writing or reviewing code, designing APIs or DB schemas, debugging, fixing bugs, running migrations, or writing any .md or API documentation."
---

# Engineering Discipline

Apply on every coding, design, and documentation task. Pairs with the response-discipline skill (communication rules).

## Docs first, never memory

For any external API, library, SDK, config format, or tool behavior:

1. Fetch the official documentation online BEFORE writing code. Training memory is stale and wrong for version-specific details.
2. One source is a claim, not a fact. Corroborate with the official/primary doc before building on it; unofficial mirrors and blogs are hints.
3. Never extend a doc claim past what it states. "No date params" says nothing about payload bounds — mark the gap as unmeasured, don't infer.
4. Plan the approach from what the docs actually say — endpoints, params, auth flow, limits.
5. Implement against the doc, not the recollection.

Maintain a doc ledger in the project root — `docs-used.md` (or `.json` if the project prefers):

- Append an entry every time a doc informs an implementation decision.
- Read the ledger at session start — re-verify against listed docs instead of re-assuming.
- If behavior looks wrong later, the ledger points to the exact doc to re-check.

Give each ledger entry an ID, and reference that ID in code at the point of use — `@see` in a JSDoc block for functions/constants (IDE-rendered), plain comment for lines inside a body:

```markdown
| ID | Doc URL | Used in | Purpose | Date |
|---|---|---|---|---|
| D1 | https://developers.google.com/.../runReport | src/lib/ga4/client.ts | runReport request shape, quota limits | 2026-08-06 |
```

```ts
/**
 * @see docs-used.md#D1 — runReport caps: 10 metrics, 9 dimensions
 */
export async function fetchReport(...) {
  // docs-used.md#D2 — quota header only present on 429
  const remaining = res.headers['x-quota-remaining'];
}
```

URL lives only in the ledger — one place to update. Code carries just the ID for cross-checking.

## Minimal code ladder

Before writing any code, stop at the first rung that holds:

1. Does this need to exist? → no: skip it (YAGNI)
2. Already in this codebase? → reuse, don't rewrite
3. Stdlib does it? → use it
4. Native platform feature? → use it
5. Installed dependency? → use it
6. One line? → one line
7. Only then: the minimum that works

Never on the chopping block: validation, error handling, security, accessibility. Minimal, not negligent.

Fix only what was asked. Adjacent problems found along the way: list them, don't fix without confirmation.

## Verification is executed, not claimed

- Never state "passes / works / fixed" without having run the command in this session. Paste the actual output line as evidence.
- End every RCA/fix with what remains unverified and the single cheapest check that would settle it. Omit if nothing is unverified.
- Before editing a shared function, type, or constant: grep all consumers first; state how many were checked.
- Risky changes (migrations, DELETE/UPDATE over ranges, auth/token flows, anything production-touching): never merge or run without tests passing; state the rollback path before executing. Destructive operations get a dry-run or row-count check first.
- Before shipping any change that can reach a destructive operation (DELETE/UPDATE/overwrite): trace every path from the new input/value to that operation — CLI flags, config, adapters — not just direct callers of the function edited.
- On entering a repo, read `docs-used.md` (if present) before the first edit.

## Logging

- Every significant event gets a log line: state transitions, external calls (request + response status), errors with full context, job start/end, quota/rate-limit hits, retries, skipped work and why.
- Log the values that would be needed to debug without reproducing: IDs, counts, durations, the branch taken.
- Errors are never swallowed silently — at minimum, logged with cause and context.

## Solve the problem, not the code

- The code is not the product; the solved problem is. Optimize for the user's actual need, not the most impressive implementation.
- No clever tricks — boring, obvious code over smart code. If it needs a comment to explain the trick, use the untricky version.
- A working solution now beats a polished abstraction later. Extra layers added after it works usually make it worse.

## Design from business behavior

APIs, DB schemas, and modules are designed from the business behavior they must serve — not from the shape of the data source or the convenience of the implementation.

- Start from the questions the business asks ("which sites have gaps?", "what changed this month?") and design tables/endpoints to answer them directly.
- State should record what the business needs to know, not what's easy to derive. Example: a sync system records fetch progress explicitly (`sync_day` rows), instead of reconstructing it by probing fact tables — the business question is "what have we fetched?", so store that.
- API contracts expose business operations ("replace this site's window", "get the decay report"), not raw CRUD over internal tables.
- Schema changes follow behavior changes. If a new business question can't be answered without joins across half the schema, the schema is modeling the source, not the domain.

## Test behavior, not implementation

- Tests assert business behavior — what the user/system observes — not internal functions, private methods, or call sequences.
- Test through the public interface: given this input/state, this outcome happens. Refactoring internals must never break a test if behavior is unchanged.
- No mocking internals just to assert "function X was called" — that pins the implementation, not the behavior.
- Every bug fix gets a test that reproduces the observed failure, then passes with the fix (pins the bug at the behavior level).

## Writing docs and .md files

Structure — same no-text-wall rules as responses:
- Headers, bullets, tables, code blocks. Never paragraph blobs.
- One concept per section; one point per bullet.
- Lead each section with the conclusion; detail after.

Style:
- Active voice: "The worker claims a row", not "A row is claimed by the worker".
- Concise: cut every word that changes nothing. "The sync runs nightly", not "The sync process is one which runs on a nightly basis".
- Simple words, precise terms. Write to express, not to impress — no filler adjectives, no repetition ("jealous and envious" → pick one).
- Concrete values over vague claims: "caps at 10 metrics", not "has some limits".

API documentation specifically:
- Organize by use case ("replace a site's window", "get the decay report"), not alphabetical endpoint lists. Reference exists; use case is the entry point.
- Every code example must have been executed — paste the exact code that ran, never write examples from memory. Stale examples rot; re-run on API changes.
- Document the unhappy path per endpoint: each error code, its likely cause, and the fix. Developers live in errors, not the 200 response.
- Lead with the common case; advanced options after. Same request→response order everywhere.
- 3 AM test: a tired developer with a deadline must find a working, copy-pasteable answer in 30 seconds, and self-serve out of any error.

## DRY

- Never duplicate information, config, constants, or logic across files — define once, reference everywhere.
- Applies to docs (URL only in ledger, ID in code), code (extract shared logic), config (single source of truth), and the skill's own rules.
- Before adding anything, check whether it already exists somewhere referenceable.

