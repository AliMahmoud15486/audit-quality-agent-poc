import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { initLogger, wrapAnthropic, traced, flush } from "braintrust";
import { getStatement } from "@/lib/sampleStatements";
import { runCheck } from "@/lib/checkEngine";

// 60s is the Vercel Hobby ceiling; a single-statement check fits comfortably.
// On Vercel Pro you can raise this to 300.
export const maxDuration = 60;

// Live-traffic tracing is OPT-IN: it activates only when BRAINTRUST_API_KEY is
// set (add it in Vercel → Settings → Environment Variables). Without the key the
// route runs exactly as before on a bare Anthropic client — no spans, no flush.
const tracingEnabled = !!process.env.BRAINTRUST_API_KEY;
if (tracingEnabled) {
  // Live requests log to the same project as the eval, but as the project's
  // "Logs" (production traffic), kept separate from "Experiments" (eval runs).
  initLogger({ projectName: "cortea-aqa-poc" });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and add your key." },
      { status: 500 }
    );
  }

  let body: { statementId?: string; statementText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Accept either a known sample id or pasted text.
  const text =
    body.statementText?.trim() ||
    (body.statementId ? getStatement(body.statementId)?.text : undefined);

  if (!text) {
    return NextResponse.json({ error: "No statement text provided." }, { status: 400 });
  }

  // Wrap the client only when tracing is on; the wrapped calls emit a nested
  // LLM span (tokens/cost/latency) under the request span below.
  const client = tracingEnabled ? wrapAnthropic(new Anthropic()) : new Anthropic();

  try {
    const result = tracingEnabled
      ? await traced(
          async (span) => {
            const r = await runCheck(text, client);
            span.log({
              input: text,
              output: r.findings,
              metadata: {
                model: r.model,
                statementId: body.statementId ?? null,
                source: body.statementText ? "pasted" : "sample",
                findingCount: r.findings.length,
              },
            });
            return r;
          },
          { name: "audit-check" }
        )
      : await runCheck(text, client);

    // Serverless: flush spans before the function freezes, or they're lost.
    if (tracingEnabled) await flush();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Check failed." },
      { status: 500 }
    );
  }
}
