// A deliberately SMALL, named subset of IFRS disclosure requirements.
// The point of the POC is depth on a slice, not coverage of all of IFRS.
// Each requirement is the unit the agent reasons over — one finding per requirement.

export type Requirement = {
  id: string;
  standardClause: string; // the exact clause the finding is tested against (the "white-box" anchor)
  title: string;
  requirement: string; // what a complete disclosure must contain
};

export const IFRS_CHECKLIST: Requirement[] = [
  {
    id: "IFRS-PRES-CCY",
    standardClause: "IAS 1.51(d)-(e)",
    title: "Presentation currency & level of rounding",
    requirement:
      "The financial statements must state the presentation currency and the level of rounding used (e.g. thousands or millions).",
  },
  {
    id: "IFRS-ENT-INFO",
    standardClause: "IAS 1.138(a)",
    title: "Entity domicile, legal form & registered office",
    requirement:
      "Disclose the entity's domicile and legal form, its country of incorporation, and the address of its registered office (or principal place of business).",
  },
  {
    id: "IFRS-PPE-DEP",
    standardClause: "IAS 16.73(b)-(c)",
    title: "PP&E depreciation methods & useful lives",
    requirement:
      "Disclose, for each class of property, plant and equipment, the depreciation method(s) used and the useful lives or depreciation rates. (May appear in the accounting-policies section rather than the PP&E note.)",
  },
  {
    id: "IFRS-INV-POL",
    standardClause: "IAS 2.36(a)",
    title: "Inventory measurement basis & cost formula",
    requirement:
      "Disclose the accounting policy for inventories, including the measurement basis (lower of cost and net realisable value) and the cost formula used (e.g. FIFO or weighted average).",
  },
  {
    id: "IFRS-RPT-KMP",
    standardClause: "IAS 24.17",
    title: "Key management personnel compensation",
    requirement:
      "Disclose key management personnel compensation in total and broken down by category (short-term employee benefits, post-employment benefits, etc.). A related-party note that omits KMP compensation does NOT satisfy this.",
  },
  {
    id: "IFRS-FIN-RISK",
    standardClause: "IFRS 7.31-34",
    title: "Nature & extent of financial risks",
    requirement:
      "Disclose the nature and extent of risks arising from financial instruments, covering credit risk, liquidity risk AND market risk. Omission of any one of the three is a gap.",
  },
  {
    id: "IFRS-CASH-COMP",
    standardClause: "IAS 7.45",
    title: "Components of cash & cash equivalents",
    requirement:
      "Disclose the components of cash and cash equivalents and a reconciliation to the equivalent items in the statement of financial position.",
  },
  {
    id: "IFRS-EVENTS",
    standardClause: "IAS 10.21",
    title: "Non-adjusting events after the reporting period",
    requirement:
      "Disclose the nature of material non-adjusting events after the reporting period and an estimate of their financial effect (or a statement that an estimate cannot be made).",
  },
  {
    id: "IFRS-EST-UNC",
    standardClause: "IAS 1.125",
    title: "Sources of estimation uncertainty",
    requirement:
      "Disclose information about assumptions and other major sources of estimation uncertainty at the reporting date that have a significant risk of material adjustment within the next financial year.",
  },
];
