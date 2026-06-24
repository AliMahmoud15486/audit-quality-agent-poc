// Synthetic IFRS financial-statement notes used as the document under review.
// Each statement is deliberately engineered to contain BOTH classic failure modes
// an audit-quality checker has to survive:
//
//   • FALSE-POSITIVE trap  — a disclosure that a naive checker calls "missing"
//     because it looks in the obvious note, when it is actually present elsewhere
//     (e.g. depreciation policy in the accounting-policies section, not the PP&E note).
//
//   • FALSE-NEGATIVE trap  — a disclosure that LOOKS present (the note exists) but is
//     materially incomplete, so a naive checker wrongly calls it "satisfied"
//     (e.g. a related-party note with no key-management compensation).
//
// Ground-truth labels live in eval/testset.ts — keep the two in sync.

export type SampleStatement = {
  id: string;
  company: string;
  text: string;
};

const HELIOS = `HELIOS COMPONENTS GmbH
Notes to the Financial Statements for the year ended 31 December 2025

1. General information
Helios Components GmbH ("the Company") is a limited liability company (Gesellschaft mit beschränkter Haftung) incorporated and domiciled in Germany. The address of its registered office is Industriestrasse 14, 80939 Munich, Germany. The Company manufactures precision components for the automotive sector.

2. Basis of preparation
These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS). They are presented in euro (EUR), and all amounts have been rounded to the nearest thousand euro (EUR'000) except where otherwise stated.

3. Summary of significant accounting policies
(a) Property, plant and equipment
Property, plant and equipment are stated at cost less accumulated depreciation. Depreciation is calculated on a straight-line basis to allocate cost to residual values over the estimated useful lives, as follows: buildings 25–40 years; plant and machinery 7–12 years; fixtures and fittings 3–5 years.
(b) Inventories
Inventories are measured at the lower of cost and net realisable value. Cost is determined using the weighted average cost formula and includes direct materials, direct labour and an appropriate share of production overheads.
(c) Revenue
Revenue is recognised when control of goods passes to the customer, in accordance with IFRS 15.

4. Property, plant and equipment
The carrying amount of property, plant and equipment at 31 December 2025 was EUR'000 48,210 (2024: EUR'000 44,905). Additions during the year amounted to EUR'000 6,140, and the depreciation charge for the year was EUR'000 3,002. There were no impairment losses recognised during the year.

5. Inventories
Inventories comprise raw materials of EUR'000 5,310, work in progress of EUR'000 2,180 and finished goods of EUR'000 4,025. During the year EUR'000 410 of inventories was written down to net realisable value.

6. Cash and cash equivalents
Cash and cash equivalents comprise cash at bank of EUR'000 7,420 and short-term deposits with original maturities of three months or less of EUR'000 2,500. The total of EUR'000 9,920 agrees to cash and cash equivalents presented in the statement of financial position.

7. Financial risk management
The Company is exposed to credit risk and liquidity risk through its financial instruments.
Credit risk: The Company's credit risk arises principally from trade receivables. The Company applies the IFRS 9 simplified approach and recognised a loss allowance of EUR'000 180 (2024: EUR'000 165).
Liquidity risk: The Company manages liquidity risk by maintaining committed credit facilities of EUR'000 10,000 and monitoring rolling cash-flow forecasts. The contractual maturities of trade and other payables are all within twelve months.

8. Related party transactions
During the year the Company purchased raw materials of EUR'000 1,240 from Aurora Metals GmbH, an entity controlled by a shareholder of the Company. Amounts outstanding to Aurora Metals GmbH at year end were EUR'000 95. All transactions were carried out on normal commercial terms.

9. Commitments
At 31 December 2025 the Company had capital commitments contracted but not provided for of EUR'000 1,800.`;

const NORTHWIND = `NORTHWIND LOGISTICS plc
Notes to the Consolidated Financial Statements for the year ended 31 December 2025

1. Corporate information
Northwind Logistics plc is a public limited company. The consolidated financial statements were authorised for issue by the Board of Directors.

2. Basis of preparation
The consolidated financial statements have been prepared in accordance with IFRS as adopted in the UK. Amounts are presented in pounds sterling and rounded to the nearest million (GBP'm).

3. Critical accounting estimates and judgements
In applying the Group's accounting policies, management has made the following judgements involving estimation uncertainty that have a significant risk of resulting in a material adjustment within the next financial year: (i) the recoverable amount of goodwill, which depends on discounted cash-flow projections and the discount rate applied; and (ii) the useful lives of the vehicle fleet.

4. Inventories
Inventories of fuel and consumable parts are measured at the lower of cost and net realisable value, with cost determined on a first-in, first-out (FIFO) basis.

5. Cash and cash equivalents
Cash and cash equivalents in the statement of financial position comprise cash at bank and in hand of GBP'm 142 and short-term highly liquid deposits of GBP'm 60.

6. Financial risk management
The Group is exposed to credit risk, liquidity risk and market risk.
Credit risk is managed through counterparty limits. Liquidity risk is managed through a revolving credit facility of GBP'm 250. Market risk: the Group is exposed to interest-rate risk on its floating-rate borrowings and to fuel-price risk, which it partially hedges using commodity forward contracts.

7. Key management personnel
Compensation of key management personnel was as follows: short-term employee benefits GBP'm 4.2; post-employment benefits GBP'm 0.6; share-based payments GBP'm 1.1; total GBP'm 5.9.

8. Events after the reporting period
On 3 February 2026, after the reporting date, the Group acquired 100% of the share capital of Coastal Freight Ltd for cash consideration of GBP'm 38. The initial accounting for the business combination is incomplete at the date these financial statements were authorised for issue.`;

export const SAMPLE_STATEMENTS: SampleStatement[] = [
  { id: "helios", company: "Helios Components GmbH (DE, HGB/IFRS, manufacturing)", text: HELIOS },
  { id: "northwind", company: "Northwind Logistics plc (UK, IFRS, logistics group)", text: NORTHWIND },
];

export function getStatement(id: string): SampleStatement | undefined {
  return SAMPLE_STATEMENTS.find((s) => s.id === id);
}
