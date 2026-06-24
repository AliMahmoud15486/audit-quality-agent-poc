import Link from "next/link";
import results from "@/eval/results.json";

export const metadata = {
  title: "Eval — Audit Quality Agent",
  description: "Precision/recall snapshot with planted false-positive and false-negative traps.",
};

type Trap = {
  trap: string;
  statementId: string;
  requirementId: string;
  predicted: string;
  truth: string;
  correct: boolean;
  why: string;
};

type Snapshot = {
  generatedAt: string | null;
  model: string;
  totals: { tp: number; fp: number; tn: number; fn: number; scored: number; missing: number; ungrounded: number };
  metrics: { precision: number; recall: number; f1: number };
  statements: { id: string; company: string; gap: number; review: number; ok: number }[];
  traps: Trap[];
};

export default function EvalPage() {
  const r = results as unknown as Snapshot;
  const generatedAt = r.generatedAt;
  const hasRun = Boolean(generatedAt);
  const date = generatedAt
    ? new Date(generatedAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })
    : null;

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="brand">
          Audit Quality Agent <span className="dot">·</span> Evaluation
        </div>
        <div className="subtitle">
          How often is it right, and in which direction? Precision/recall on problem-detection, with planted traps.
        </div>
      </header>

      <p className="meta">
        <Link href="/">← back to the checker</Link>
      </p>

      {!hasRun ? (
        <div className="error">
          No eval snapshot yet. Run <code>npm run eval</code> locally (needs your API key), then commit{" "}
          <code>eval/results.json</code> and push — this page renders that committed snapshot.
        </div>
      ) : (
        <>
          <div className="meta">
            Snapshot generated {date} · model {r.model} · {r.totals.scored} labelled cases scored
            {r.totals.missing ? ` (${r.totals.missing} missing predictions)` : ""}.
          </div>

          <div className="summary">
            <span className="pill green">
              <span className="n">{r.metrics.recall}%</span> recall
            </span>
            <span className="pill">
              <span className="n">{r.metrics.precision}%</span> precision
            </span>
            <span className="pill">
              <span className="n">{r.metrics.f1}%</span> F1
            </span>
            <span className="pill">
              <span className="n">{r.totals.ungrounded}</span> ungrounded quotes caught
            </span>
          </div>

          <div className="card">
            <div className="req-title">Confusion matrix</div>
            <p className="rationale" style={{ fontVariantNumeric: "tabular-nums" }}>
              True positives <strong>{r.totals.tp}</strong> · False positives <strong>{r.totals.fp}</strong> · True
              negatives <strong>{r.totals.tn}</strong> · False negatives <strong>{r.totals.fn}</strong>
            </p>
            <div className="evidence">
              <div className="label"><span>How to read it</span></div>
              <blockquote style={{ fontStyle: "normal" }}>
                <strong>Recall</strong> = of real gaps, how many got flagged — low recall means missed gaps that survive
                to sign-off (the dangerous error). <strong>Precision</strong> = of what was flagged, how much was real —
                low precision means false alarms that train auditors to ignore the tool. A single accuracy number hides
                both; the traps below are where to actually look.
              </blockquote>
            </div>
          </div>

          <div className="note" style={{ borderTop: "none", marginTop: 18, marginBottom: 6, paddingTop: 0 }}>
            Planted traps — the deceptive cases that separate a real checker from a naive one
          </div>
          {r.traps.map((t) => (
            <div className="card" key={`${t.statementId}:${t.requirementId}`}>
              <div className="card-top">
                <div>
                  <div className="req-title">
                    {t.trap === "FP" ? "False-positive trap" : "False-negative trap"} · {t.requirementId}
                  </div>
                  <div className="clause">
                    {t.statementId} · predicted “{t.predicted}” · truth “{t.truth}”
                  </div>
                </div>
                <div className="badges">
                  <span className={`status ${t.correct ? "satisfied" : "gap"}`}>
                    {t.correct ? "✓ handled" : "✗ missed"}
                  </span>
                </div>
              </div>
              <p className="rationale">{t.why}</p>
            </div>
          ))}

          <div className="note">
            Per statement:{" "}
            {r.statements
              .map((s) => `${s.company} — ${s.gap} gaps / ${s.review} needs-review / ${s.ok} satisfied`)
              .join("  ·  ")}
            . This snapshot is committed to the repo and refreshed by re-running <code>npm run eval</code> and pushing —
            in a real product this same harness runs in CI as a regression guard on every prompt/model change.
          </div>
        </>
      )}
    </div>
  );
}
