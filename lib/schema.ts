// Structured-output contract for the Audit Quality Agent.
// The model is constrained to this schema (output_config.format) so every run
// returns the same shape — no parsing of free text.

export type FindingStatus = "satisfied" | "gap" | "needs_review";
export type Confidence = "high" | "medium" | "low";

// What the model returns (per requirement).
export type ModelFinding = {
  requirementId: string;
  status: FindingStatus;
  citedPassage: string; // verbatim quote from the statement that supports the conclusion ("" if none)
  locationHint: string; // where in the document it was found (e.g. "Note 3(a)")
  confidence: Confidence;
  rationale: string;
};

// What we return to the UI after code-side grounding enforcement is applied.
export type EnforcedFinding = ModelFinding & {
  standardClause: string; // joined from the checklist (the white-box anchor)
  requirementTitle: string;
  grounded: boolean; // ENFORCED in code: is citedPassage actually present in the source text?
};

// JSON Schema handed to the API. Note IFRS structured-output limits: enums OK,
// no minLength/maxLength, additionalProperties:false required on every object.
export const FINDINGS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          requirementId: { type: "string" },
          status: { type: "string", enum: ["satisfied", "gap", "needs_review"] },
          citedPassage: {
            type: "string",
            description:
              "Verbatim quote from the statement supporting the conclusion. Empty string if no supporting text exists.",
          },
          locationHint: {
            type: "string",
            description: "Where in the document the evidence was found, e.g. 'Note 3(a)'. Empty if none.",
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          rationale: { type: "string" },
        },
        required: ["requirementId", "status", "citedPassage", "locationHint", "confidence", "rationale"],
      },
    },
  },
  required: ["findings"],
} as const;
