import Anthropic from "@anthropic-ai/sdk";
import { IFRS_CHECKLIST } from "./checklist";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import {
  FINDINGS_JSON_SCHEMA,
  ModelFinding,
  EnforcedFinding,
} from "./schema";

export const DEFAULT_MODEL = process.env.CORTEA_POC_MODEL || "claude-opus-4-8";

// Normalise whitespace for a forgiving "is this quote really in the source?" check.
// We allow whitespace/quote-style differences but nothing else — the model still
// has to reproduce the substance of the passage, which is what grounding means.
function normalize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// The ENFORCED anti-hallucination step. The model claims a citedPassage; we verify
// in code that it actually appears in the source. "No hallucination" is not a promise
// we take on faith from the model — it is checked here.
function isGrounded(citedPassage: string, sourceText: string): boolean {
  const cited = normalize(citedPassage);
  if (cited.length < 8) return false; // too short to be meaningful evidence
  return normalize(sourceText).includes(cited);
}

export type CheckResult = {
  model: string;
  findings: EnforcedFinding[];
  raw: ModelFinding[];
};

export async function runCheck(
  statementText: string,
  client?: Anthropic
): Promise<CheckResult> {
  const anthropic = client || new Anthropic();

  // output_config.format is newer than some SDK type defs — pass loosely so the
  // request works regardless of the installed @anthropic-ai/sdk version.
  const params: any = {
    model: DEFAULT_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(statementText) }],
    output_config: {
      format: { type: "json_schema", schema: FINDINGS_JSON_SCHEMA },
    },
  };

  const response: any = await anthropic.messages.create(params);

  // With output_config.format the first text block is valid JSON; a thinking block
  // may precede it, so find the text block explicitly.
  const textBlock = (response.content || []).find((b: any) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("No text block returned from the model.");
  }

  let parsed: { findings: ModelFinding[] };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error("Model output was not valid JSON: " + textBlock.text.slice(0, 200));
  }

  const byId = new Map(IFRS_CHECKLIST.map((r) => [r.id, r]));

  const findings: EnforcedFinding[] = (parsed.findings || []).map((f) => {
    const req = byId.get(f.requirementId);
    const grounded =
      f.status === "gap" && !f.citedPassage
        ? true // a clean gap with no claimed evidence is trivially "grounded"
        : isGrounded(f.citedPassage, statementText);

    return {
      ...f,
      standardClause: req?.standardClause || "(unknown clause)",
      requirementTitle: req?.title || f.requirementId,
      grounded,
    };
  });

  return { model: response.model || DEFAULT_MODEL, findings, raw: parsed.findings || [] };
}
