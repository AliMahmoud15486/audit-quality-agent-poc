# Audit Quality Agent — IFRS disclosure completeness (a PM work-sample for Cortea.ai)

A working slice of Cortea's "Audit Quality Agent" concept, built to demonstrate the
exact thing the **AI Product Manager** role screens for:

> *"Prototype with AI tools to test ideas in hours… understand the unique challenges:
> evals, latency, hallucinations, trust, UX of probabilistic systems."* — Cortea JD

It takes a financial-statement notes document and checks it against a named subset of
IFRS disclosure requirements, returning per-requirement findings that are
**standards-grounded, evidence-anchored, and auditor-in-the-loop** — and it backs that
with an **eval** that measures the failures auditors actually care about.

## What it demonstrates (mapped to the role)

| Role responsibility | Where it shows up here |
|---|---|
| Prototype AI ideas fast | The whole app — Next.js + Claude, runnable in one command |
| Handle the messy reality of AI limits | `lib/checkEngine.ts` — grounding is **enforced in code**, not trusted |
| The hallucination / trust problem | Every quote verified against the source; ungrounded quotes flagged in the UI |
| Probabilistic UX for liability-bearing users | Status + confidence + cited clause + "auditor decides", never a black-box verdict |
| Evals | `eval/` — precision/recall on problem-detection with planted FP & FN traps |
| Structure & writing | `PRD.md` — problem, metrics, risks, roadmap |

## Run it

```bash
cd Cortea/POC
npm install
cp .env.local.example .env.local      # add your ANTHROPIC_API_KEY
npm run dev                           # → http://localhost:3000
```

Pick a sample company, click **Run completeness check**, then **↓ Download report**
to get a self-contained HTML file you can email/share (opens offline, prints to PDF).
Then run the eval:

```bash
npm run eval
```

## Generating & sharing a report

After a check, **↓ Download report** produces a single self-contained `.html` file
([lib/report.ts](lib/report.ts)) — inlined styles, no dependencies, no server. It
carries the findings, the summary, and a "how this was produced" methodology footer,
so a reader gets the product thinking without running anything. Attach it to an email
or open it and print to PDF.

To put it in front of someone as a **live link** instead, see **[DEPLOY.md](DEPLOY.md)**
(Vercel, with the API-key cost-protection note).

## The three trust mechanics (the actual product)

The value isn't "an LLM reads a statement." It's the harness that makes the output
defensible at sign-off:

1. **Standards-grounded, not open-ended** — the agent answers a closed question per
   named clause (*does this satisfy IAS 24.17?*), not "find problems".
2. **Evidence-anchored + enforced grounding** — every non-gap conclusion quotes the
   verbatim source passage; a code check verifies the quote exists and rejects it if
   not. "No hallucination" is *verified*, not promised.
3. **Completeness, not presence + human-in-the-loop** — a note that exists but is
   incomplete is a `gap`; ambiguity returns `needs_review`; the auditor decides every
   line.

Built on `claude-opus-4-8` via structured outputs — the same foundation-model layer
Cortea describes itself as sitting on top of.

## Layout

```
app/                 Next.js UI + /api/check route
lib/
  checklist.ts       9 named IFRS disclosure requirements (the closed question set)
  sampleStatements.ts synthetic statements with planted FP & FN traps
  prompt.ts          system prompt encoding the trust rules
  schema.ts          structured-output contract
  checkEngine.ts     Claude call + ENFORCED grounding check (shared by app & eval)
  report.ts          self-contained HTML report generator (download / print to PDF)
eval/
  testset.ts         ground-truth labels (incl. the traps)
  run-eval.ts        precision / recall / F1 + per-trap pass-fail
PRD.md               the product doc
DEPLOY.md            how to share: downloadable report + Vercel live-link guide
```

## Honest limitations (also the roadmap)

- Verbatim-substring grounding is strict — faithful paraphrases get rejected. v2 would
  add a semantic-grounding fallback with a confidence band.
- 9 requirements, 2 statements — a slice, not coverage. The eval is built to *grow*
  into a regression guardrail.
- Single-shot; no reviewer accept/override loop yet — that loop is where the
  proprietary finding-data moat would come from (see `PRD.md §7`).

---
*Built by Ali Mahmoud as a work-sample. Not affiliated with Cortea.ai.*
