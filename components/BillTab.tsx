"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type BillEstimate,
  type DemoOption,
  type Procedure,
  PROCEDURES,
  AGE_OPTIONS,
  SEX_OPTIONS,
  RACE_OPTIONS,
  SHORT_RACE,
  procedureByCode,
  estimateBill,
  usd,
  verdictLabel,
  negotiationScript,
} from "@/lib/bill";
import { loadRiskDB } from "@/lib/risk";
import { useStored, DashRule, PerforatedEdge } from "./ui";

const ink = "var(--rc-ink)";
const inkSoft = "var(--rc-ink-soft)";
const orange = "var(--rc-orange)";
const blue = "var(--rc-blue)";
const stampRed = "var(--rc-stamp-red)";
const mintInk = "var(--rc-mint-ink)";

export function BillTab() {
  const [ageOpts, setAgeOpts] = useState<DemoOption[]>(AGE_OPTIONS);
  const [raceOpts, setRaceOpts] = useState<DemoOption[]>(RACE_OPTIONS);
  const [sexOpts, setSexOpts] = useState<DemoOption[]>(SEX_OPTIONS);

  // Share the exact same selections as the US Risk tab.
  const [ageId, setAgeId] = useStored("risk_age", "35_44");
  const [raceId, setRaceId] = useStored("risk_race", "nh_white");
  const [sexId, setSexId] = useStored("risk_sex", "female");
  const [code, setCode] = useStored("bill_code", PROCEDURES[8].code);
  const [query, setQuery] = useState("");
  const [showScript, setShowScript] = useState(false);

  // Pull the richer option labels from the risk dataset when present.
  useEffect(() => {
    let live = true;
    loadRiskDB().then((db) => {
      if (!live || !db) return;
      setAgeOpts(db.age_groups);
      setRaceOpts(db.race_groups);
      setSexOpts(db.sex_groups);
    });
    return () => {
      live = false;
    };
  }, []);

  const proc = procedureByCode(code) ?? PROCEDURES[8];
  const estimate = useMemo(
    () => estimateBill(proc, ageId, sexId, raceId),
    [proc, ageId, sexId, raceId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROCEDURES;
    return PROCEDURES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [query]);

  const age = ageOpts.find((o) => o.id === ageId) ?? ageOpts[0];
  const sex = sexOpts.find((o) => o.id === sexId) ?? sexOpts[0];
  const race = raceOpts.find((o) => o.id === raceId) ?? raceOpts[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ padding: "12px 16px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Bill Receipt</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>FAIR PRICE</div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
          A clearer bill. Pick a procedure, then your group — see a fair price and the gap.
        </div>

        {/* Procedure search + select */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search procedures by name or code…"
          aria-label="Search procedures"
          style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 9,
            padding: "9px 11px",
            fontSize: 12,
            color: "#fff",
            outline: "none",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <PickerBox
          title="Procedure"
          value={code}
          onChange={setCode}
          options={filtered.map((p) => ({ id: p.code, label: `${p.code} · ${p.name}` }))}
          empty="No matching procedures."
        />

        {/* Demographics */}
        <div style={{ display: "flex", gap: 8 }}>
          <PickerBox title="Age" value={ageId} onChange={setAgeId} options={ageOpts} />
          <PickerBox title="Sex" value={sexId} onChange={setSexId} options={sexOpts} />
        </div>
        <PickerBox
          title="Race/ethnicity"
          value={raceId}
          onChange={setRaceId}
          options={raceOpts}
          display={(o) => SHORT_RACE[o.id] ?? o.label}
        />
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 16px 96px" }}>
        <div key={`${code}|${ageId}|${raceId}|${sexId}`} className="fade-in">
          <BillReceiptCard
            estimate={estimate}
            age={age}
            sex={sex}
            race={race}
            showScript={showScript}
            onToggleScript={() => setShowScript((s) => !s)}
          />
        </div>
      </div>
    </div>
  );
}

function PickerBox({
  title,
  value,
  onChange,
  options,
  display,
  empty,
}: {
  title: string;
  value: string;
  onChange: (id: string) => void;
  options: DemoOption[];
  display?: (o: DemoOption) => string;
  empty?: string;
}) {
  const label = (o: DemoOption) => (display ? display(o) : o.label);
  const current = options.find((o) => o.id === value) ?? options[0];
  return (
    <label
      style={{
        flex: 1,
        minWidth: 0,
        background: "rgba(255,255,255,0.12)",
        borderRadius: 9,
        padding: "7px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
      }}
    >
      <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
        {title}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {current ? label(current) : empty ?? "—"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.6)" }}>⌄</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title}
        disabled={options.length === 0}
        style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {label(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function BillReceiptCard({
  estimate,
  age,
  sex,
  race,
  showScript,
  onToggleScript,
}: {
  estimate: BillEstimate;
  age: DemoOption;
  sex: DemoOption;
  race: DemoOption;
  showScript: boolean;
  onToggleScript: () => void;
}) {
  const { proc, fairLow, fairTypical, fairHigh, commonlyBilled, overcharge, verdict } = estimate;
  const verdictColor = verdict === "within" ? mintInk : verdict === "above" ? orange : stampRed;

  return (
    <div style={{ filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.35))" }}>
      <PerforatedEdge pointUp />
      <div style={{ background: "var(--rc-cream)", color: ink, padding: "18px 22px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24, fontWeight: 800 }}>$</span>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1 }}>BILL RECEIPT</div>
        </div>
        <div style={{ background: orange, height: 3, marginTop: 6 }} />
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>
          {proc.name} · code {proc.code}
        </div>

        {/* Profile */}
        <div style={{ position: "relative", marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>POPULATION PROFILE</div>
          <div style={{ fontSize: 11, color: inkSoft, marginTop: 2 }}>
            Age {age?.label} · {sex?.label}
          </div>
          <div style={{ fontSize: 11, color: inkSoft }}>{race?.label}</div>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: -4,
              transform: "rotate(-9deg)",
              border: "2px solid " + stampRed,
              color: stampRed,
              borderRadius: 4,
              padding: "3px 6px",
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            ILLUSTRATIVE
          </div>
        </div>

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>

        {/* Fair price band */}
        <div style={{ fontSize: 11, fontWeight: 700 }}>FAIR PRICE (CASH)</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: mintInk }}>{usd(fairTypical)}</span>
          <span style={{ fontSize: 12, color: inkSoft }}>typical</span>
        </div>
        <FairBar low={fairLow} typical={fairTypical} high={fairHigh} billed={commonlyBilled} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: inkSoft, marginTop: 4 }}>
          <span>low {usd(fairLow)}</span>
          <span>high {usd(fairHigh)}</span>
        </div>

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>

        {/* Commonly billed for this group */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 11, fontWeight: 700 }}>COMMONLY BILLED · YOUR GROUP</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: verdictColor }}>{usd(commonlyBilled)}</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: verdictColor, marginTop: 2 }}>
          {verdictLabel(verdict)}
        </div>
        {overcharge > 0 && (
          <div style={{ fontSize: 11, color: inkSoft, marginTop: 4 }}>
            Modeled gap vs fair price:{" "}
            <span style={{ fontWeight: 700, color: stampRed }}>{usd(overcharge)}</span> over {usd(fairTypical)}.
          </div>
        )}
        <div style={{ fontSize: 11, color: blue, fontWeight: 600, marginTop: 4 }}>
          Aim to settle near {usd(fairTypical)}.
        </div>

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>

        {/* Negotiation script */}
        <button
          onClick={onToggleScript}
          style={{
            width: "100%",
            textAlign: "left",
            fontSize: 11,
            fontWeight: 700,
            color: blue,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{showScript ? "▾" : "▸"}</span> Negotiation script
        </button>
        {showScript && (
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              lineHeight: 1.6,
              color: ink,
              background: "rgba(43,107,176,0.08)",
              border: "1px dashed " + blue,
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            {negotiationScript(estimate)}
          </div>
        )}

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>

        {/* Guardrails */}
        <div style={{ fontSize: 11, fontWeight: 700 }}>HOW TO READ THIS</div>
        <div style={{ fontSize: 9, color: inkSoft, lineHeight: 1.5, marginTop: 2 }}>
          · Fair price is the same for everyone. The &ldquo;your group&rdquo; figure is a <b>simulated</b>{" "}
          model of billing &amp; coverage disparities — not a claim that a fair price differs by who you are.
        </div>
        <div style={{ fontSize: 9, color: inkSoft, lineHeight: 1.5, marginTop: 2 }}>
          · Estimate method: national fair-price anchor × illustrative demographic exposure factor
          ({estimate.factor.toFixed(2)}×). No verified local geography.
        </div>
        <div style={{ fontSize: 9, color: inkSoft, lineHeight: 1.5, marginTop: 2 }}>
          · Check the code, date, provider, modifier, units and line total against your original bill.
        </div>

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, textAlign: "center" }}>
          Not a bill, an insurance quote, or medical advice.
        </div>
        <div style={{ fontSize: 8, color: inkSoft, lineHeight: 1.5, marginTop: 6 }}>
          Illustrative placeholder prices only — replace with partner-validated data before public use.
          Computed on device; no account, no upload.
        </div>
      </div>
      <PerforatedEdge pointUp={false} />
    </div>
  );
}

/** A low–high fair-price bar with a marker for the commonly-billed amount. */
function FairBar({
  low,
  typical,
  high,
  billed,
}: {
  low: number;
  typical: number;
  high: number;
  billed: number;
}) {
  // Scale spans fair-low → max(fairHigh, billed) so the billed marker is visible.
  const max = Math.max(high, billed);
  const span = max - low || 1;
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - low) / span) * 100))}%`;

  return (
    <div style={{ position: "relative", height: 16, marginTop: 8 }}>
      {/* full track */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: 0,
          right: 0,
          height: 4,
          borderRadius: 2,
          background: "#d8d2c2",
        }}
      />
      {/* fair range */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: pct(low),
          width: `calc(${pct(high)} - ${pct(low)})`,
          height: 4,
          borderRadius: 2,
          background: "var(--rc-mint-border)",
        }}
      />
      {/* typical tick */}
      <div
        style={{
          position: "absolute",
          top: 2,
          left: pct(typical),
          width: 2,
          height: 12,
          background: mintInk,
          transform: "translateX(-1px)",
        }}
      />
      {/* billed marker */}
      <div
        title="Commonly billed"
        style={{
          position: "absolute",
          top: 0,
          left: pct(billed),
          width: 10,
          height: 16,
          transform: "translateX(-5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 12, color: billed > high ? stampRed : mintInk, fontWeight: 800 }}>▼</span>
      </div>
    </div>
  );
}
