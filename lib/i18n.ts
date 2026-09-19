// Localization primitives — mirrors the iOS Lang / LStr / tr() model.

export type Lang = "en" | "es" | "hi";

export const LANG_SHORT: Record<Lang, string> = {
  en: "EN",
  es: "ES",
  hi: "हिं",
};

export type LStr = Partial<Record<Lang, string>>;

/** Localized lookup. Falls back to English, then empty string. */
export function tr(s: LStr, lang: Lang): string {
  return s[lang] ?? s.en ?? "";
}

export type Currency = "usd" | "inr";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  usd: "$",
  inr: "₹",
};

/** Locale-correct digit grouping: en-IN uses lakh (1,00,000), en-US thousands. */
export function fmtCurrency(currency: Currency, v: number): string {
  const locale = currency === "inr" ? "en-IN" : "en-US";
  const n = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(Math.round(v));
  return `${CURRENCY_SYMBOL[currency]}${n}`;
}
