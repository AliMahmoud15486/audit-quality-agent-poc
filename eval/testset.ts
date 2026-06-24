// Ground-truth labels for the eval. Keep in sync with lib/sampleStatements.ts.
//
// "problem" = the disclosure requirement is NOT fully met (a real gap an auditor
// must act on). In eval terms a "problem" is the positive class — the thing the
// agent should flag (status gap OR needs_review). "satisfied" is the negative class.
//
// Two cases are TRAPS and are tagged so the runner reports them explicitly:
//   trap: "FP"  — looks missing, is actually present elsewhere. Truth = satisfied.
//                 A weak agent over-flags it (false positive → review fatigue).
//   trap: "FN"  — looks present, is actually incomplete. Truth = problem.
//                 A weak agent under-flags it (false negative → missed at sign-off).

export type Label = {
  statementId: string;
  requirementId: string;
  truth: "problem" | "satisfied";
  trap?: "FP" | "FN";
  why: string;
};

export const LABELS: Label[] = [
  // ---- Helios Components GmbH ----
  { statementId: "helios", requirementId: "IFRS-PRES-CCY", truth: "satisfied", why: "EUR + rounded to nearest thousand stated in Note 2." },
  { statementId: "helios", requirementId: "IFRS-ENT-INFO", truth: "satisfied", why: "Domicile, GmbH legal form and registered office in Note 1." },
  {
    statementId: "helios",
    requirementId: "IFRS-PPE-DEP",
    truth: "satisfied",
    trap: "FP",
    why: "Depreciation method + useful lives ARE disclosed — in accounting policies (Note 3a), not the PP&E note (Note 4). Flagging a gap here is a false positive.",
  },
  { statementId: "helios", requirementId: "IFRS-INV-POL", truth: "satisfied", why: "Lower of cost and NRV, weighted average — Note 3(b)." },
  {
    statementId: "helios",
    requirementId: "IFRS-RPT-KMP",
    truth: "problem",
    trap: "FN",
    why: "Related-party note (Note 8) exists but discloses NO key-management compensation. Calling this satisfied is a false negative.",
  },
  {
    statementId: "helios",
    requirementId: "IFRS-FIN-RISK",
    truth: "problem",
    why: "Note 7 covers credit and liquidity risk but omits market risk → incomplete under IFRS 7.",
  },
  { statementId: "helios", requirementId: "IFRS-CASH-COMP", truth: "satisfied", why: "Components + reconciliation to SOFP in Note 6." },
  { statementId: "helios", requirementId: "IFRS-EVENTS", truth: "problem", why: "No events-after-reporting-period note at all." },
  { statementId: "helios", requirementId: "IFRS-EST-UNC", truth: "problem", why: "No estimation-uncertainty disclosure at all." },

  // ---- Northwind Logistics plc (mostly compliant — controls for over-flagging) ----
  {
    statementId: "northwind",
    requirementId: "IFRS-ENT-INFO",
    truth: "problem",
    trap: "FN",
    why: "Note 1 names the entity and legal form but omits domicile / country of incorporation / registered office address.",
  },
  { statementId: "northwind", requirementId: "IFRS-PRES-CCY", truth: "satisfied", why: "GBP, rounded to nearest million — Note 2." },
  { statementId: "northwind", requirementId: "IFRS-INV-POL", truth: "satisfied", why: "Lower of cost and NRV, FIFO — Note 4." },
  { statementId: "northwind", requirementId: "IFRS-FIN-RISK", truth: "satisfied", why: "Credit, liquidity AND market risk all covered — Note 6." },
  { statementId: "northwind", requirementId: "IFRS-RPT-KMP", truth: "satisfied", why: "Full KMP compensation breakdown with total — Note 7." },
  { statementId: "northwind", requirementId: "IFRS-EVENTS", truth: "satisfied", why: "Post-balance-sheet acquisition disclosed with effect — Note 8." },
  { statementId: "northwind", requirementId: "IFRS-EST-UNC", truth: "satisfied", why: "Goodwill + fleet useful-life estimation uncertainty — Note 3." },
  {
    statementId: "northwind",
    requirementId: "IFRS-CASH-COMP",
    truth: "satisfied",
    why: "Components of cash & cash equivalents disclosed — Note 5.",
  },
  {
    statementId: "northwind",
    requirementId: "IFRS-PPE-DEP",
    truth: "problem",
    why: "Fleet useful lives are mentioned only as an estimate (Note 3); no depreciation method/useful-life disclosure for PP&E classes.",
  },
];
