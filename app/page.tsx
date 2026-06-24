"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_STATEMENTS } from "@/lib/sampleStatements";
import { EnforcedFinding } from "@/lib/schema";
import { generateReportHtml } from "@/lib/report";

type ApiResult = { model: string; findings: EnforcedFinding[] };

export default function Home() {
  const [statementId, setStatementId] = useState(SAMPLE_STATEMENTS[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!result) return;
    const company = SAMPLE_STATEMENTS.find((s) => s.id === statementId)?.company || statementId;
    const html = generateReportHtml({
      company,
      model: result.model,
      findings: result.findings,
      generatedAt: new Date().toISOString(),
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-quality-report-${slug}-${date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const counts = result
    ? {
        gap: result.findings.filter((f) => f.status === "gap").length,
        review: result.findings.filter((f) => f.status === "needs_review").length,
        ok: result.findings.filter((f) => f.status === "satisfied").length,
        ungrounded: result.findings.filter((f) => !f.grounded).length,
      }
    : null;

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="brand">
          Audit Quality Agent <span className="dot">·</span> IFRS disclosure completeness
        </div>
        <div className="subtitle">
          Standards-grounded · evidence-anchored · auditor-in-the-loop. A PM work-sample, built on Claude.
        </div>
      </header>

      <div className="controls">
        <select value={statementId} onChange={(e) => setStatementId(e.target.value)} disabled={loading}>
          {SAMPLE_STATEMENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.company}
            </option>
          ))}
        </select>
        <button className="run" onClick={run} disabled={loading}>
          {loading ? "Reviewing…" : "Run completeness check"}
        </button>
      </div>

      <div className="meta">
        The agent tests the statement against a named subset of IFRS disclosure requirements. Every conclusion
        links to the exact clause and the verbatim passage it was tested against. A code-side grounding check
        verifies each quote actually exists in the source — the auditor decides. See the{" "}
        <Link href="/eval">evaluation →</Link> for precision/recall and the planted traps.
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Running {SAMPLE_STATEMENTS.find((s) => s.id === statementId)?.company} against the checklist…</div>}

      {result && counts && (
        <>
          <div className="summary">
            <span className="pill">
              <span className="n">{counts.gap}</span> gaps
            </span>
            <span className="pill">
              <span className="n">{counts.review}</span> needs review
            </span>
            <span className="pill">
              <span className="n">{counts.ok}</span> satisfied
            </span>
            <span className="pill">
              <span className="n">{counts.ungrounded}</span> ungrounded quotes caught
            </span>
            <button className="download" onClick={downloadReport} title="Download a self-contained HTML report (prints to PDF)">
              ↓ Download report
            </button>
          </div>

          {result.findings.map((f) => (
            <div className="card" key={f.requirementId}>
              <div className="card-top">
                <div>
                  <div className="req-title">{f.requirementTitle}</div>
                  <div className="clause">
                    {f.standardClause} · {f.requirementId}
                  </div>
                </div>
                <div className="badges">
                  <span className="conf">conf: {f.confidence}</span>
                  <span className={`status ${f.status}`}>{f.status.replace("_", " ")}</span>
                </div>
              </div>

              <p className="rationale">{f.rationale}</p>

              {f.citedPassage ? (
                <div className="evidence">
                  <div className="label">
                    <span>Evidence{f.locationHint ? ` · ${f.locationHint}` : ""}</span>
                    <span className={`grounded ${f.grounded ? "ok" : "bad"}`}>
                      {f.grounded ? "✓ grounded in source" : "✗ quote not found — flagged"}
                    </span>
                  </div>
                  <blockquote>“{f.citedPassage}”</blockquote>
                </div>
              ) : (
                <div className="evidence">
                  <div className="label">
                    <span>Evidence</span>
                    <span className="grounded ok">✓ clean gap — no evidence claimed</span>
                  </div>
                  <blockquote>No supporting disclosure located in the document.</blockquote>
                </div>
              )}
            </div>
          ))}

          <div className="note">
            Model: {result.model}. The agent flags and cites; it never signs. This is a deliberately narrow
            slice ({result.findings.length} requirements) — the design point is the trust mechanics
            (grounding, traceability, completeness-not-presence), not breadth of IFRS coverage. See the{" "}
            <Link href="/eval">evaluation</Link> for the precision/recall harness with planted false-positive
            and false-negative traps.
          </div>
        </>
      )}
    </div>
  );
}
