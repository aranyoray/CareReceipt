import type { LStr, Currency, Lang } from "./i18n";

export type ReceiptStyle = "detailed" | "condensed";

export interface RiskItem {
  name: LStr;
  incidencePer100: number; // prevalence, "12.7 in 100"
  avgCareValue: number; // per-person annual care cost
  source?: LStr;
}

/** Community-average offer = prevalence-weighted care value. Never a bill. */
export function itemAmount(item: RiskItem): number {
  return (item.incidencePer100 / 100) * item.avgCareValue;
}

export interface PreventionAction {
  label: LStr;
  cost: string; // e.g. "$0–$50", "₹2,200", "PRICELESS"
}

export interface ReferralPathway {
  name: LStr;
  role: LStr;
  access: LStr;
  url?: string | null;
}

export interface SignalContent {
  signal: LStr;
  whyItMatters: LStr;
  contextTitle: LStr;
  contextRows: { label: LStr; value: LStr }[];
}

export interface CareModule {
  id: string;
  tab: string;
  languages: Lang[];
  style: ReceiptStyle;
  currency: Currency;
  profileTitle: LStr;
  profileLines: LStr[];
  items: RiskItem[];
  exposureLabel?: LStr;
  exposureCaption?: LStr;
  dataNote?: LStr;
  signal?: SignalContent;
  prevention: PreventionAction[];
  referrals: ReferralPathway[];
  footnote: LStr;
}

export function exposureTotal(m: CareModule): number {
  return m.items.reduce((sum, it) => sum + itemAmount(it), 0);
}
