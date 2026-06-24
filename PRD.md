# PRD — Audit Quality Agent: IFRS Disclosure Completeness (slice)

**Author:** Ali Mahmoud · **Status:** Prototype / work-sample · **Surface:** web app + eval harness

> A deliberately narrow slice of Cortea's "Audit Quality Agent" concept, built to demonstrate the product judgment the AI PM role requires — not to cover IFRS.

---

## 1. Problem

External auditors are personally accountable at sign-off, yet disclosure completeness review is manual, repetitive, and easy to get wrong under time pressure. Two specific failure modes drive both audit risk and tool distrust:

- **Missed gaps (false negatives):** a note *exists* but is materially incomplete (e.g. a related-party note with no key-management compensation). Easy to skim past; surfaces as a regulatory finding later.
- **False alarms (false positives):** a reviewer flags a disclosure as missing when it's simply located in a different section (e.g. depreciation policy in accounting policies, not the PP&E note). Each false alarm erodes trust in the tool.

Regulators (FRC, PCAOB) increasingly demand documented reliability of AI-assisted evidence — explainability is a hard requirement, not a nice-to-have.

## 2. Users & jobs-to-be-done

| User | Job |
|---|---|
| Audit senior / manager | "Tell me which required disclosures are missing or incomplete, with the evidence, so I review faster and miss less." |
| Engagement partner | "Show me a defensible trail from each conclusion to the standard and the source — something I can stand behind at sign-off." |

The agent's role is explicit: **it flags, drafts, and cites. The auditor reviews, approves, and signs.** No audit opinion is ever issued by the model.

## 3. Scope of this slice

- **In:** 9 named IFRS disclosure requirements (IAS 1, IAS 2, IAS 7, IAS 16, IAS 24, IAS 10, IFRS 7), tested against a financial-statement notes document. Per-requirement status, cited evidence, confidence, and an enforced grounding check.
- **Out (deliberately):** full IFRS coverage, multi-standard jurisdictions, integrations, IT audit, numerical/figure validation, the engagement-file workflow.

## 4. How it works (the three trust mechanics)

The product value is not "an LLM reads the statement." It is the **harness around the model** that makes the output defensible:

1. **Standards-grounded, not open-ended.** The agent reasons over a fixed, named requirement set (each with its exact clause) — `does this satisfy IAS 24.17?` — not "find problems." Scope is bounded; the question is closed.
2. **Evidence-anchored + enforced grounding.** Every non-gap conclusion must quote the verbatim supporting passage. A **code-side check** then verifies that quote actually exists in the source and rejects it if not. *"No hallucination" is verified in code, not promised by the model.* (See `lib/checkEngine.ts → isGrounded`.)
3. **Completeness, not presence + human-in-the-loop.** A note that exists but omits a required element is a `gap`, not `satisfied`. Ambiguous cases return `needs_review`. The auditor is the decision-maker on every line.

Built on Claude (`claude-opus-4-8`) via structured outputs — the same foundation-model layer Cortea describes itself sitting on top of.

## 5. Success metrics

| Metric | Why it's the right metric |
|---|---|
| **Recall on real gaps** | A missed gap is the dangerous error — it survives to sign-off. Primary safety metric. |
| **Precision on flags** | Each false positive costs auditor trust; low precision kills adoption regardless of recall. |
| **Grounding rate** | % of cited quotes that verify against source. Directly maps to the FRC/PCAOB "documented reliability" requirement. |
| **Trap handling** | Explicit pass/fail on planted FP and FN cases — the failures aggregate numbers hide. |

Vanity metric to avoid: "flagged an issue in 100% of statements." High recall with unmeasured precision is over-flagging dressed up as thoroughness.

## 6. Key risks & open questions (what I'd dig into as PM)

- **Precision/recall frontier:** where do we set the `needs_review` threshold? Auditors may prefer high recall + a triage queue over silent automation. *Needs design-partner interviews.*
- **Grounding strictness:** verbatim-substring is a strict v1. Paraphrase-but-faithful citations get rejected — is that the right trade, or do we need semantic grounding with a confidence band?
- **Multi-jurisdiction scale:** each standard/version/jurisdiction multiplies the requirement surface. Build depth-first (one regime excellent) or breadth-first? This is the core roadmap bet.
- **Integration dependence:** the review layer must insert into engagement platforms owned by potential competitors. What's the minimum viable integration?
- **Moat:** final-review checking is copyable. The defensibility is proprietary finding data + grounding rigor + standards-coverage depth — not the model.

## 7. What I'd build next

1. Add 3–4 statements and expand the labeled eval set; track precision/recall per requirement over time (regression guardrail for prompt/model changes).
2. A reviewer "accept / override / add-note" loop → captures the proprietary finding data that becomes the moat.
3. Confidence-calibrated triage UI (sort by `needs_review` + low confidence first).
4. Semantic grounding fallback when verbatim match fails, with the auditor shown both.
