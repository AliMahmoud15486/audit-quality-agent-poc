// Precision/recall harness for the Audit Quality Agent.
//
// Run with:  npm run eval
// Requires ANTHROPIC_API_KEY (loaded from .env.local).
//
// "Positive" = the agent flags a problem (status gap OR needs_review).
// We report precision and recall on problem-detection, then call out the two
// planted traps explicitly — because a single aggregate number hides exactly the
// failures auditors care about (the missed gap, the false alarm).

import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also pick up plain .env if present

import { writeFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { runCheck } from "../lib/checkEngine";
import { getStatement, SAMPLE_STATEMENTS } from "../lib/sampleStatements";
import { LABELS } from "./testset";

function predIsProblem(status: string): boolean {
  return status === "gap" || status === "needs_review";
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set. Copy .env.local.example to .env.local and add your key.");
    process.exit(1);
  }

  const client = new Anthropic();

  // Run each statement once; index findings by requirement id.
  const predByKey = new Map<string, { status: string; grounded: boolean; confidence: string }>();
  let ungroundedCount = 0;
  let modelUsed = "";
  const statementSummaries: { id: string; company: string; gap: number; review: number; ok: number }[] = [];

  for (const s of SAMPLE_STATEMENTS) {
    const stmt = getStatement(s.id)!;
    process.stderr.write(`Reviewing ${stmt.company} …\n`);
    const { findings, model } = await runCheck(stmt.text, client);
    modelUsed = model;
    let gap = 0,
      review = 0,
      ok = 0;
    for (const f of findings) {
      predByKey.set(`${s.id}:${f.requirementId}`, {
        status: f.status,
        grounded: f.grounded,
        confidence: f.confidence,
      });
      if (f.citedPassage && !f.grounded) ungroundedCount++;
      if (f.status === "gap") gap++;
      else if (f.status === "needs_review") review++;
      else ok++;
    }
    statementSummaries.push({ id: s.id, company: stmt.company, gap, review, ok });
  }

  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0,
    missing = 0;
  const trapResults: string[] = [];
  const trapRows: {
    trap: string;
    statementId: string;
    requirementId: string;
    predicted: string;
    truth: string;
    correct: boolean;
    why: string;
  }[] = [];

  for (const label of LABELS) {
    const pred = predByKey.get(`${label.statementId}:${label.requirementId}`);
    if (!pred) {
      missing++;
      continue;
    }
    const predProblem = predIsProblem(pred.status);
    const truthProblem = label.truth === "problem";

    if (truthProblem && predProblem) tp++;
    else if (!truthProblem && predProblem) fp++;
    else if (!truthProblem && !predProblem) tn++;
    else fn++;

    if (label.trap) {
      const correct = predProblem === truthProblem;
      trapResults.push(
        `  [${label.trap}] ${label.statementId}/${label.requirementId}: ` +
          `predicted ${pred.status} (truth ${label.truth}) → ${correct ? "✓ handled" : "✗ MISSED"}\n      ${label.why}`
      );
      trapRows.push({
        trap: label.trap,
        statementId: label.statementId,
        requirementId: label.requirementId,
        predicted: pred.status,
        truth: label.truth,
        correct,
        why: label.why,
      });
    }
  }

  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  // Persist a snapshot the /eval web page renders (committed to the repo).
  const snapshot = {
    generatedAt: new Date().toISOString(),
    model: modelUsed,
    totals: { tp, fp, tn, fn, scored: tp + fp + tn + fn, missing, ungrounded: ungroundedCount },
    metrics: {
      precision: Math.round(precision * 1000) / 10,
      recall: Math.round(recall * 1000) / 10,
      f1: Math.round(f1 * 1000) / 10,
    },
    statements: statementSummaries,
    traps: trapRows,
  };
  writeFileSync(join(process.cwd(), "eval", "results.json"), JSON.stringify(snapshot, null, 2) + "\n");
  process.stderr.write("Wrote eval/results.json (rendered at /eval). Commit & push to update the live page.\n");

  console.log("\n================ Audit Quality Agent — eval ================\n");
  console.log(`Cases scored: ${tp + fp + tn + fn}  (missing predictions: ${missing})`);
  console.log(`Confusion:  TP=${tp}  FP=${fp}  TN=${tn}  FN=${fn}`);
  console.log(`Precision (flagged problems that are real):  ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall    (real problems that got flagged):  ${(recall * 100).toFixed(1)}%`);
  console.log(`F1:                                          ${(f1 * 100).toFixed(1)}%`);
  console.log(`Ungrounded quotes caught by the code check:  ${ungroundedCount}`);
  console.log("\n---- Planted traps (the cases that actually matter) ----");
  console.log(trapResults.join("\n"));
  console.log("\nReading: a false negative (missed gap) is the dangerous error — it survives to sign-off.");
  console.log("A false positive (false alarm) is the adoption killer — it trains auditors to ignore the tool.");
  console.log("Aggregate precision/recall hides both; the trap rows are where to look.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
