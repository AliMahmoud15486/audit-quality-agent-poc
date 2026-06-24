# Eval — why this is the part that matters

A demo that flags some gaps proves nothing. The hard question for an audit-quality
product is **how often it's wrong, and in which direction** — because the two
directions have very different consequences:

- **False negative (missed gap)** — the agent calls an incomplete disclosure
  "satisfied". This is the *dangerous* error: it survives to sign-off and surfaces
  later as a regulatory finding. The whole value proposition fails silently.
- **False positive (false alarm)** — the agent flags a disclosure that is actually
  present (just located elsewhere). This is the *adoption-killing* error: every
  false alarm trains the auditor to ignore the tool.

A headline like "flagged issues in 100% of statements" measures **recall only** and
hides precision entirely. So this harness reports both, and then calls out two
**planted traps** by name:

| Trap | Statement / requirement | What it tests |
|---|---|---|
| **FP** | Helios / `IFRS-PPE-DEP` | Depreciation policy is in the accounting-policies note, not the PP&E note. A weak agent flags it missing. Correct answer: **satisfied**. |
| **FN** | Helios / `IFRS-RPT-KMP` | A related-party note exists but omits key-management compensation. A weak agent calls it satisfied. Correct answer: **problem**. |
| **FN** | Northwind / `IFRS-ENT-INFO` | Entity named but no domicile / registered office. Looks fine at a glance. Correct answer: **problem**. |

## Run it

```bash
npm install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run eval
```

Output: a confusion matrix, precision / recall / F1 on problem-detection, the count
of ungrounded quotes the code-side check caught, and an explicit pass/fail line for
each planted trap.

## How to read it

- **Recall** is the safety number — optimise it first for an audit tool, then claw
  back precision with a `needs_review` triage tier rather than silent automation.
- **The trap rows** are where to actually look. Aggregate precision/recall over a
  small set can look fine while still missing the one case that matters.
- **Grounding** is reported separately: it's a different guarantee (is the cited
  evidence real?) from correctness (is the verdict right?). Both have to hold.

## Extending the set

Add a statement to `lib/sampleStatements.ts`, then add one labelled row per
requirement to `testset.ts` (`truth: "problem" | "satisfied"`, plus an optional
`trap` tag). The harness scores whatever is labelled — this is how you'd turn a
demo into a regression guardrail that runs on every prompt or model change.
