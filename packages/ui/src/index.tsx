"use client";

import React, { useEffect, useState } from "react";

/* ============================================================================
   Shared primitives for CareReceipt and ReliefReceipt.

   The Billculate originals modelled a thermal printer: ReceiptPaper drew a
   cream page, PerforatedEdge drew tear-off teeth, DashRule drew the dotted
   separators and Stamp drew a tilted rubber stamp.  None of that survives.
   A finding is a row in a card, severity is a coloured rail, and a verdict is
   a badge.  The only thing kept from the old look is tabular figures, because
   columns of money genuinely do need to line up.
   ========================================================================= */

export type Tone = "danger" | "warn" | "ok" | "info" | "neutral";

/* ------------------------------------------------------------------ layout */

export function Card({
  children,
  flush,
  raised,
  className = "",
}: {
  children: React.ReactNode;
  flush?: boolean;
  raised?: boolean;
  className?: string;
}) {
  return (
    <div className={`card${flush ? " flush" : ""}${raised ? " raised" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function Stack({ children, tight }: { children: React.ReactNode; tight?: boolean }) {
  return <div className={tight ? "stack-s" : "stack"}>{children}</div>;
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="row">{children}</div>;
}

export function Split({ controls, results }: { controls: React.ReactNode; results: React.ReactNode }) {
  return (
    <div className="split">
      <div className="stack">{controls}</div>
      <div className="stack">{results}</div>
    </div>
  );
}

export function Divider() {
  return <hr className="divider" />;
}

/* -------------------------------------------------------------------- text */

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="h1">{children}</h1>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="h2">{children}</h2>;
}

export function Lede({ children }: { children: React.ReactNode }) {
  return <p className="lede">{children}</p>;
}

export function Fine({ children }: { children: React.ReactNode }) {
  return <p className="fine">{children}</p>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/** Section heading. Replaces the old all-caps SectionLabel inside the paper. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/* ------------------------------------------------------------------ status */

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone | "new" }) {
  return <span className={tone === "neutral" ? "badge" : `badge ${tone}`}>{children}</span>;
}

/** Severity rail. Replaces the tilted rubber Stamp. */
export function Rail({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <div className={tone === "neutral" ? "rail" : `rail ${tone}`}>{children}</div>;
}

export function Note({ tone = "info", children }: { tone?: Tone; children: React.ReactNode }) {
  return <div className={`note ${tone === "neutral" ? "info" : tone}`}>{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

/* ------------------------------------------------------------------ figures */

export function Stat({ value, label }: { value: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="stat">
      <span className="stat-v">{value}</span>
      <span className="stat-k">{label}</span>
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="stat-row">{children}</div>;
}

export function Num({ children }: { children: React.ReactNode }) {
  return <span className="num">{children}</span>;
}

/**
 * One finding. Replaces the dashed receipt Line: the amount is still right
 * aligned and tabular, but there is no leader of dots and no paper.
 */
export function LineItem({
  label,
  amount,
  sub,
  flagged,
}: {
  label: React.ReactNode;
  amount?: React.ReactNode;
  sub?: React.ReactNode;
  flagged?: boolean;
}) {
  return (
    <div className={flagged ? "lineitem flagged" : "lineitem"}>
      <div className="lineitem-main">{label}</div>
      {amount !== undefined && <div className="lineitem-amt">{amount}</div>}
      {sub && <div className="lineitem-sub">{sub}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- controls */

export function Button({
  children,
  onClick,
  primary,
  wide,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  wide?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = ["btn", primary ? "primary" : "", wide ? "wide" : ""].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="fine" style={{ marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export interface Option {
  id: string;
  label: string;
}

export function Chips({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="chip"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- format */

export function usd(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function usdShort(v: number): string {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(v)}`;
}

/* -------------------------------------------------------------------- hooks */

/** localStorage-backed state that degrades to plain state when storage throws. */
export function useStored(key: string, initial: string): [string, (v: string) => void] {
  const [v, setV] = useState(initial);
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(key);
      if (s !== null) setV(s);
    } catch {}
  }, [key]);
  const set = (next: string) => {
    setV(next);
    try {
      window.localStorage.setItem(key, next);
    } catch {}
  };
  return [v, set];
}

/** Debounces a value so expensive parses do not run on every keystroke. */
export function useDebounced<T>(value: T, ms: number): T {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setOut(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return out;
}
