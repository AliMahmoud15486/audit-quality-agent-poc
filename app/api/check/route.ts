import { NextRequest, NextResponse } from "next/server";
import { getStatement } from "@/lib/sampleStatements";
import { runCheck } from "@/lib/checkEngine";

// 60s is the Vercel Hobby ceiling; a single-statement check fits comfortably.
// On Vercel Pro you can raise this to 300.
export const maxDuration = 60;

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

  try {
    const result = await runCheck(text);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Check failed." },
      { status: 500 }
    );
  }
}
