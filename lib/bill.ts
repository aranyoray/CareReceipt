// Bill Receipt — a fair-price / bill-transparency tool, ported in spirit from
// empealth.org ("a clearer bill, a stronger voice"). Empealth looks up a
// procedure price by ZIP; here the lookup is driven by age, sex and
// race/ethnicity so it reuses the same population pickers as the US Risk tab.
//
// ALL dollar figures are illustrative placeholders, not a quote, an insurance
// estimate, or a real chargemaster. Fair price does NOT depend on who a person
// is — the demographic adjustment below is a SIMULATED model of documented
// billing / coverage disparities (out-of-network and balance billing fall
// harder on some groups), included so the tool is interactive. Replace every
// number with partner-validated data before any public use.

export interface Procedure {
  code: string; // CPT / HCPCS
  name: string;
  category: string;
  // Fair cash-price benchmark (USD), demographic-independent.
  fairLow: number;
  fairTypical: number;
  fairHigh: number;
}

export interface DemoOption {
  id: string;
  label: string;
}

// Fallback pickers if the risk dataset is unavailable — IDs mirror
// RiskReceiptUS.json so selections are shared across tabs.
export const AGE_OPTIONS: DemoOption[] = [
  { id: "18_24", label: "18-24" },
  { id: "25_34", label: "25-34" },
  { id: "35_44", label: "35-44" },
  { id: "45_54", label: "45-54" },
  { id: "55_64", label: "55-64" },
  { id: "65_69", label: "65-69" },
  { id: "70_74", label: "70-74" },
  { id: "75_79", label: "75-79" },
  { id: "80_plus", label: "80+" },
];

export const SEX_OPTIONS: DemoOption[] = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
];

export const RACE_OPTIONS: DemoOption[] = [
  { id: "hispanic_any_race", label: "Hispanic, any race" },
  { id: "nh_white", label: "Non-Hispanic White only" },
  { id: "nh_black", label: "Non-Hispanic Black/African American only" },
  { id: "nh_asian", label: "Non-Hispanic Asian only" },
  { id: "nh_aian", label: "Non-Hispanic American Indian/Alaska Native" },
  { id: "nh_other_multiracial", label: "Non-Hispanic other / multiple races" },
];

export const SHORT_RACE: Record<string, string> = {
  hispanic_any_race: "Hispanic",
  nh_white: "White (NH)",
  nh_black: "Black (NH)",
  nh_asian: "Asian (NH)",
  nh_aian: "AI/AN (NH)",
  nh_other_multiracial: "Other/multi (NH)",
};

// Illustrative fair cash prices, roughly ordered by everyday prevention →
// imaging → procedures. Not real published rates.
export const PROCEDURES: Procedure[] = [
  { code: "36415", name: "Blood draw (venipuncture)", category: "Lab", fairLow: 5, fairTypical: 12, fairHigh: 30 },
  { code: "81003", name: "Urinalysis, automated", category: "Lab", fairLow: 5, fairTypical: 10, fairHigh: 25 },
  { code: "83036", name: "Hemoglobin A1c", category: "Lab", fairLow: 10, fairTypical: 20, fairHigh: 38 },
  { code: "85025", name: "Complete blood count (CBC)", category: "Lab", fairLow: 10, fairTypical: 20, fairHigh: 40 },
  { code: "80053", name: "Comprehensive metabolic panel", category: "Lab", fairLow: 10, fairTypical: 22, fairHigh: 45 },
  { code: "80061", name: "Lipid panel", category: "Lab", fairLow: 15, fairTypical: 28, fairHigh: 55 },
  { code: "93000", name: "Electrocardiogram (EKG)", category: "Diagnostic", fairLow: 30, fairTypical: 55, fairHigh: 120 },
  { code: "71046", name: "Chest X-ray, 2 views", category: "Imaging", fairLow: 45, fairTypical: 95, fairHigh: 210 },
  { code: "99213", name: "Office visit, established (low)", category: "Visit", fairLow: 75, fairTypical: 120, fairHigh: 180 },
  { code: "99214", name: "Office visit, established (moderate)", category: "Visit", fairLow: 110, fairTypical: 165, fairHigh: 250 },
  { code: "99203", name: "Office visit, new patient", category: "Visit", fairLow: 110, fairTypical: 170, fairHigh: 260 },
  { code: "77067", name: "Screening mammogram", category: "Imaging", fairLow: 100, fairTypical: 170, fairHigh: 290 },
  { code: "70450", name: "CT head, no contrast", category: "Imaging", fairLow: 300, fairTypical: 550, fairHigh: 1100 },
  { code: "72148", name: "MRI lumbar spine, no contrast", category: "Imaging", fairLow: 350, fairTypical: 600, fairHigh: 1100 },
  { code: "99283", name: "Emergency visit, moderate", category: "Emergency", fairLow: 350, fairTypical: 650, fairHigh: 1300 },
  { code: "45378", name: "Colonoscopy, diagnostic", category: "Procedure", fairLow: 900, fairTypical: 1500, fairHigh: 2800 },
];

export function procedureByCode(code: string): Procedure | undefined {
  return PROCEDURES.find((p) => p.code === code);
}

// Gross-charge inflation of a hospital chargemaster over fair cash price.
const BASE_MARKUP = 2.8;

// Illustrative multipliers. Older ages carry more line items / complexity.
const AGE_FACTOR: Record<string, number> = {
  "18_24": 0.9,
  "25_34": 0.95,
  "35_44": 1.0,
  "45_54": 1.06,
  "55_64": 1.12,
  "65_69": 1.16,
  "70_74": 1.2,
  "75_79": 1.24,
  "80_plus": 1.28,
};

const SEX_FACTOR: Record<string, number> = { male: 1.0, female: 1.03 };

// SIMULATED billing-exposure index — a placeholder for documented disparities
// in out-of-network / balance billing and coverage, NOT a claim that a fair
// price differs by race. Replace with validated data.
const RACE_FACTOR: Record<string, number> = {
  nh_white: 1.0,
  nh_asian: 1.0,
  nh_other_multiracial: 1.08,
  hispanic_any_race: 1.12,
  nh_black: 1.14,
  nh_aian: 1.16,
};

export type Verdict = "within" | "above" | "far_above";

export interface BillEstimate {
  proc: Procedure;
  fairLow: number;
  fairTypical: number;
  fairHigh: number;
  commonlyBilled: number; // demographic-adjusted gross charge
  overcharge: number; // commonlyBilled − fairTypical (floored at 0)
  verdict: Verdict;
  factor: number; // combined demographic multiplier applied to the markup
}

export function estimateBill(
  proc: Procedure,
  ageId: string,
  sexId: string,
  raceId: string,
): BillEstimate {
  const factor =
    (AGE_FACTOR[ageId] ?? 1) * (SEX_FACTOR[sexId] ?? 1) * (RACE_FACTOR[raceId] ?? 1);
  const commonlyBilled = Math.round(proc.fairTypical * BASE_MARKUP * factor);

  let verdict: Verdict = "within";
  if (commonlyBilled > proc.fairHigh * 1.8) verdict = "far_above";
  else if (commonlyBilled > proc.fairHigh) verdict = "above";

  return {
    proc,
    fairLow: proc.fairLow,
    fairTypical: proc.fairTypical,
    fairHigh: proc.fairHigh,
    commonlyBilled,
    overcharge: Math.max(0, commonlyBilled - proc.fairTypical),
    verdict,
    factor,
  };
}

const USD = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export function usd(v: number): string {
  return `$${USD.format(Math.round(v))}`;
}

export function verdictLabel(v: Verdict): string {
  if (v === "far_above") return "Far above the fair range";
  if (v === "above") return "Above the fair range";
  return "Within a defensible range";
}

/** A plain-language opener for the hospital billing team. */
export function negotiationScript(e: BillEstimate): string {
  return (
    `Hello, I'm calling about a charge for ${e.proc.name} (code ${e.proc.code}). ` +
    `Comparable fair cash prices for this service run about ${usd(e.fairLow)}–${usd(e.fairHigh)}, ` +
    `with ${usd(e.fairTypical)} typical. My bill lists ${usd(e.commonlyBilled)}. ` +
    `Can you review the code, units and modifier, and tell me the self-pay or ` +
    `financial-assistance rate? I'd like to settle close to the fair price of ${usd(e.fairTypical)}. ` +
    `Before we finish, may I have your name, a reference number, and the expected response date?`
  );
}
