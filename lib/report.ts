import { EnforcedFinding } from "./schema";

// Builds a SELF-CONTAINED HTML report (inlined CSS, no external assets, no JS).
// The output is a single file the user can download, email, or open offline, and
// print straight to PDF from any browser. Nothing here runs on the server.

export type ReportInput = {
  company: string;
  model: string;
  findings: EnforcedFinding[];
  generatedAt: string; // ISO string, stamped by the caller
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STATUS_LABEL: Record<string, string> = {
  satisfied: "Satisfied",
  gap: "Gap",
  needs_review: "Needs review",
};

export function generateReportHtml(input: ReportInput): string {
  const { company, model, findings, generatedAt } = input;

  const gaps = findings.filter((f) => f.status === "gap").length;
  const review = findings.filter((f) => f.status === "needs_review").length;
  const ok = findings.filter((f) => f.status === "satisfied").length;
  const ungrounded = findings.filter((f) => f.citedPassage && !f.grounded).length;

  const dateStr = new Date(generatedAt).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const findingRows = findings
    .map((f) => {
      const evidence = f.citedPassage
        ? `<div class="ev">
             <div class="ev-label">
               <span>Evidence${f.locationHint ? ` &middot; ${esc(f.locationHint)}` : ""}</span>
               <span class="${f.grounded ? "ok" : "bad"}">${
                 f.grounded ? "&#10003; grounded in source" : "&#10007; quote not found &mdash; flagged"
               }</span>
             </div>
             <blockquote>&ldquo;${esc(f.citedPassage)}&rdquo;</blockquote>
           </div>`
        : `<div class="ev">
             <div class="ev-label"><span>Evidence</span><span class="ok">&#10003; clean gap &mdash; no evidence claimed</span></div>
             <blockquote>No supporting disclosure located in the document.</blockquote>
           </div>`;

      return `<div class="card">
        <div class="card-top">
          <div>
            <div class="req-title">${esc(f.requirementTitle)}</div>
            <div class="clause">${esc(f.standardClause)} &middot; ${esc(f.requirementId)}</div>
          </div>
          <div class="badges">
            <span class="conf">conf: ${esc(f.confidence)}</span>
            <span class="status ${esc(f.status)}">${esc(STATUS_LABEL[f.status] || f.status)}</span>
          </div>
        </div>
        <p class="rationale">${esc(f.rationale)}</p>
        ${evidence}
      </div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Audit Quality Agent — Disclosure Completeness Report — ${esc(company)}</title>
<style>
  :root{--ink:#14181f;--muted:#5b6573;--line:#e3e7ec;--accent:#0f766e;--green:#15803d;--green-bg:#e9f6ec;--red:#b42318;--red-bg:#fdecea;--amber:#b45309;--amber-bg:#fdf3e6;}
  *{box-sizing:border-box;}
  body{margin:0;background:#fff;color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;}
  .page{max-width:880px;margin:0 auto;padding:40px 36px 64px;}
  .masthead{border-bottom:2px solid var(--accent);padding-bottom:16px;margin-bottom:20px;}
  .kicker{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);font-weight:700;}
  h1{font-size:22px;margin:6px 0 4px;letter-spacing:-.01em;}
  .meta{color:var(--muted);font-size:12.5px;}
  .summary{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 8px;}
  .pill{border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;}
  .pill .n{font-weight:800;}
  .pill.red{border-color:#f3c6c0;color:var(--red);} .pill.amber{border-color:#f0d9b3;color:var(--amber);} .pill.green{border-color:#bfe3c8;color:var(--green);}
  .section-title{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:28px 0 10px;font-weight:700;}
  .card{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:10px;break-inside:avoid;}
  .card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
  .req-title{font-weight:650;}
  .clause{color:var(--muted);font-size:12px;}
  .badges{display:flex;gap:8px;align-items:center;flex-shrink:0;}
  .status{font-size:11px;font-weight:800;padding:3px 9px;border-radius:6px;text-transform:uppercase;letter-spacing:.02em;}
  .status.satisfied{color:var(--green);background:var(--green-bg);} .status.gap{color:var(--red);background:var(--red-bg);} .status.needs_review{color:var(--amber);background:var(--amber-bg);}
  .conf{font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:6px;padding:2px 7px;}
  .rationale{margin:9px 0 0;}
  .ev{margin-top:9px;border-left:3px solid var(--accent);background:#f3faf9;padding:7px 11px;border-radius:0 8px 8px 0;font-size:13px;}
  .ev-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);display:flex;justify-content:space-between;gap:8px;}
  .ev-label .ok{color:var(--green);font-weight:700;} .ev-label .bad{color:var(--red);font-weight:700;}
  blockquote{margin:5px 0 0;font-style:italic;color:#243;}
  .method{border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:#fafbfc;font-size:12.5px;}
  .method li{margin-bottom:6px;}
  .footer{margin-top:28px;border-top:1px dashed var(--line);padding-top:14px;color:var(--muted);font-size:11.5px;}
  @media print{.page{padding:0;} body{font-size:12px;}}
</style>
</head>
<body>
<div class="page">
  <div class="masthead">
    <div class="kicker">Audit Quality Agent</div>
    <h1>IFRS Disclosure Completeness Report</h1>
    <div class="meta">${esc(company)} &middot; generated ${esc(dateStr)} &middot; model ${esc(model)}</div>
  </div>

  <div class="summary">
    <span class="pill red"><span class="n">${gaps}</span> gaps</span>
    <span class="pill amber"><span class="n">${review}</span> needs review</span>
    <span class="pill green"><span class="n">${ok}</span> satisfied</span>
    <span class="pill"><span class="n">${ungrounded}</span> ungrounded quotes caught</span>
  </div>

  <div class="section-title">Findings (${findings.length} requirements tested)</div>
  ${findingRows}

  <div class="section-title">How this report was produced</div>
  <div class="method">
    <ul>
      <li><strong>Standards-grounded, not open-ended.</strong> Each requirement is a closed question tested against its named clause (e.g. <em>does this satisfy IAS 24.17?</em>) &mdash; not "find problems".</li>
      <li><strong>Evidence-anchored, grounding enforced in code.</strong> Every non-gap conclusion quotes the verbatim source passage; a code-side check verifies the quote actually exists in the document and flags it if not. "No hallucination" is <em>verified</em>, not promised.</li>
      <li><strong>Completeness, not presence &mdash; auditor in the loop.</strong> A note that exists but is incomplete is a gap; ambiguity returns "needs review". The agent flags and cites; the auditor reviews, approves, and signs.</li>
    </ul>
  </div>

  <div class="footer">
    Prototype / work-sample by Ali Mahmoud. Built on Anthropic Claude. Tests a deliberately narrow subset of IFRS disclosure
    requirements &mdash; the design point is the trust mechanics (grounding, traceability, completeness-not-presence), not breadth
    of IFRS coverage. Not an audit opinion; for demonstration only. Not affiliated with Cortea.ai.
  </div>
</div>
</body>
</html>`;
}
