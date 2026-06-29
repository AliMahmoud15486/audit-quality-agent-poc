// Braintrust-wired version of the Audit Quality Agent eval.
//
// Run with:  npm run eval:braintrust
// Requires ANTHROPIC_API_KEY + BRAINTRUST_API_KEY (loaded from .env.local).
//
// Same ground truth and problem-detection logic as run-eval.ts, but logged to
// Braintrust so every requirement check is an inspectable row, the two planted
// traps (FP/FN) are tagged in metadata, and precision/recall/accuracy show up
// as dashboard metrics you can slice over time.
//
// "Positive" = the agent flags a problem (status gap OR needs_review).
// One model call per statement is shared across that statement's requirement
// rows (see findingsForStatement) — same cost as run-eval.ts: 2 LLM calls.

import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also pick up plain .env if present

import Anthropic from "@anthropic-ai/sdk";
import { Eval, wrapAnthropic } from "braintrust";
import { runCheck } from "../lib/checkEngine";
import { getStatement } from "../lib/sampleStatements";
import { LABELS } from "./testset";

function predIsProblem(status: string): boolean {
  return status === "gap" || status === "needs_review";
}

// wrapAnthropic instruments the SDK so each messages.create() is logged as a
// span with token counts, cost and latency. checkEngine.runCheck() already
// accepts an injected client, so this is the only change needed to capture it.
const client = wrapAnthropic(new Anthropic());

type Pred = { status: string; grounded: boolean; confidence: string; citedPassage: string };

// Memoise the model call per statement so the 18 requirement rows trigger only
// one runCheck() per statement (2 calls total), not one call per row.
const checkCache = new Map<string, Promise<Map<string, Pred>>>();

function findingsForStatement(statementId: string): Promise<Map<string, Pred>> {
  if (!checkCache.has(statementId)) {
    const stmt = getStatement(statementId)!;
    checkCache.set(
      statementId,
      runCheck(stmt.text, client).then(({ findings }) => {
        const byReq = new Map<string, Pred>();
        for (const f of findings) {
          byReq.set(f.requirementId, {
            status: f.status,
            grounded: f.grounded,
            confidence: f.confidence,
            citedPassage: f.citedPassage,
          });
        }
        return byReq;
      })
    );
  }
  return checkCache.get(statementId)!;
}

Eval("cortea-aqa-poc", {
  // One row per ground-truth requirement label.
  data: () =>
    LABELS.map((label) => ({
      input: { statementId: label.statementId, requirementId: label.requirementId },
      expected: label.truth, // "problem" | "satisfied"
      metadata: {
        trap: label.trap ?? "none",
        why: label.why,
        company: getStatement(label.statementId)?.company ?? label.statementId,
      },
    })),

  // Run the agent and return its predicted status for this requirement.
  task: async (input: { statementId: string; requirementId: string }) => {
    const byReq = await findingsForStatement(input.statementId);
    return byReq.get(input.requirementId)?.status ?? "missing";
  },

  scores: [
    // Accuracy over every requirement row: did problem-detection match the truth?
    ({ output, expected }) => ({
      name: "Correct",
      score: predIsProblem(output) === (expected === "problem") ? 1 : 0,
    }),

    // Recall — only the real problems count. null on satisfied rows excludes them
    // from the mean, so the average of this score IS recall on problem-detection.
    ({ output, expected }) => ({
      name: "Recall",
      score: expected === "problem" ? (predIsProblem(output) ? 1 : 0) : null,
    }),

    // Precision — only flagged rows count. Average of this score IS precision.
    ({ output, expected }) => ({
      name: "Precision",
      score: predIsProblem(output) ? (expected === "problem" ? 1 : 0) : null,
    }),

    // Trap handling — surfaced as its own metric for the two planted cases; null
    // elsewhere. A miss here is the failure auditors actually care about.
    ({ output, expected, metadata }) => ({
      name: "TrapHandled",
      score:
        metadata?.trap && metadata.trap !== "none"
          ? predIsProblem(output) === (expected === "problem")
            ? 1
            : 0
          : null,
    }),
  ],
});
