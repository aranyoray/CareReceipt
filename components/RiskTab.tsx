"use client";

import { useEffect, useState } from "react";
import {
  type RiskDB,
  type RiskCell,
  type RiskOption,
  loadRiskDB,
  profileKey,
  knownPresent,
  needsDisclosure,
  shortName,
  scopeText,
  shortRace,
  per100,
} from "@/lib/risk";
import { useStored, DashRule, PerforatedEdge } from "./ui";

const ink = "var(--rc-ink)";
const inkSoft = "var(--rc-ink-soft)";
const orange = "var(--rc-orange)";
const blue = "var(--rc-blue)";
const stampRed = "var(--rc-stamp-red)";
const mintInk = "var(--rc-mint-ink)";

export function RiskTab() {
  const [db, setDb] = useState<RiskDB | null>(null);
  const [failed, setFailed] = useState(false);
  const [ageId, setAgeId] = useStored("risk_age", "35_44");
  const [raceId, setRaceId] = useStored("risk_race", "nh_white");
  const [sexId, setSexId] = useStored("risk_sex", "female");
  const [preId, setPreId] = useStored("risk_pre", "");

  useEffect(() => {
    let live = true;
    loadRiskDB().then((loaded) => {
      if (!live) return;
      setDb(loaded);
      setFailed(loaded === null);
      if (loaded) {
        // Heal selections that no longer exist in a regenerated dataset.
        if (!loaded.age_groups.some((o) => o.id === ageId)) setAgeId("35_44");
        if (!loaded.race_groups.some((o) => o.id === raceId)) setRaceId("nh_white");
        if (!loaded.sex_groups.some((o) => o.id === sexId)) setSexId("female");
        if (preId !== "" && !loaded.preexisting.includes(preId)) setPreId("");
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return <Centered>Risk data unavailable</Centered>;
  }
  if (!db) {
    return <Centered>Loading…</Centered>;
  }

  const age = pick(db.age_groups, ageId, "35_44");
  const race = pick(db.race_groups, raceId, "nh_white");
  const sex = pick(db.sex_groups, sexId, "female");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ padding: "12px 16px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>US Risk Receipt</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>CDC NHIS</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <PickerBox title="Age" value={ageId} onChange={setAgeId} options={db.age_groups} />
          <PickerBox title="Sex" value={sexId} onChange={setSexId} options={db.sex_groups} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <PickerBox
            title="Race/ethnicity"
            value={raceId}
            onChange={setRaceId}
            options={db.race_groups}
            display={(o) => shortRace(o.id) ?? o.label}
          />
          <PickerBox
            title="Already diagnosed"
            value={preId}
            onChange={setPreId}
            options={[{ id: "", label: "None" }, ...db.preexisting.map((id) => ({ id, label: shortName(id) }))]}
          />
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 16px 96px" }}>
        {age && race && sex ? (
          <div key={`${ageId}|${raceId}|${sexId}|${preId}`} className="fade-in">
            <RiskReceiptCard db={db} age={age} race={race} sex={sex} preId={preId} />
          </div>
        ) : (
          <Centered>Risk data unavailable</Centered>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
      {children}
    </div>
  );
}

function pick(list: RiskOption[], id: string, fallback: string): RiskOption | undefined {
  return list.find((o) => o.id === id) ?? list.find((o) => o.id === fallback) ?? list[0];
}

function PickerBox({
  title,
  value,
  onChange,
  options,
  display,
}: {
  title: string;
  value: string;
  onChange: (id: string) => void;
  options: RiskOption[];
  display?: (o: RiskOption) => string;
}) {
  const label = (o: RiskOption) => (display ? display(o) : o.label);
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
          {label(options.find((o) => o.id === value) ?? options[0])}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.6)" }}>⌄</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title}
        style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---- Risk receipt card ----

function RiskReceiptCard({
  db,
  age,
  race,
  sex,
  preId,
}: {
  db: RiskDB;
  age: RiskOption;
  race: RiskOption;
  sex: RiskOption;
  preId: string;
}) {
  const profile = db.profiles[profileKey(age.id, race.id, sex.id)];
  const cells = !profile ? {} : preId === "" ? profile.baseline : profile.given[preId] ?? {};

  const rows = db.receipt_conditions
    .filter((id) => cells[id])
    .map((id) => ({ id, cell: cells[id]! }))
    .sort((a, b) => {
      const pa = a.cell.pct ?? -1;
      const pb = b.cell.pct ?? -1;
      if (pb !== pa) return pb - pa;
      return a.id < b.id ? 1 : a.id > b.id ? -1 : 0; // id desc
    });

  const anyDisclosure = rows.some((r) => needsDisclosure(r.cell));

  return (
    <div style={{ filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.35))" }}>
      <PerforatedEdge pointUp />
      <div style={{ background: "var(--rc-cream)", color: ink, padding: "18px 22px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24, fontWeight: 800 }}>%</span>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>RISK RECEIPT</div>
        </div>
        <div style={{ background: orange, height: 3, marginTop: 6 }} />
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>
          How common is each condition among US adults like this?
        </div>

        {/* Profile */}
        <div style={{ position: "relative", marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>POPULATION PROFILE</div>
          <div style={{ fontSize: 11, color: inkSoft, marginTop: 2 }}>
            Age {age.label} · {sex.label}
          </div>
          <div style={{ fontSize: 11, color: inkSoft }}>{race.label}</div>
          {preId !== "" && (
            <div style={{ fontSize: 11, fontWeight: 600, color: blue, marginTop: 2 }}>
              Given: {shortName(preId)} already diagnosed
            </div>
          )}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: -4,
              transform: "rotate(-9deg)",
              border: "2px solid " + mintInk,
              color: mintInk,
              borderRadius: 4,
              padding: "3px 6px",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            CDC DATA
          </div>
        </div>

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>

        {/* Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
            <span>CONDITION</span>
            <span>{preId === "" ? "ADULTS AFFECTED" : "ALSO AFFECTED"}</span>
          </div>
          {rows.length === 0 && (
            <div style={{ fontSize: 11, color: inkSoft }}>No data for this profile.</div>
          )}
          {rows.map((r) => (
            <RowView key={r.id} id={r.id} c={r.cell} />
          ))}
        </div>

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {anyDisclosure && (
            <div style={{ fontSize: 9, color: blue, lineHeight: 1.5 }}>
              † Exact group too small to report reliably; the estimate uses the broader population named
              on the row.
            </div>
          )}
          {preId !== "" && (
            <div style={{ fontSize: 9, color: inkSoft, lineHeight: 1.5 }}>
              Each row&apos;s baseline uses the same population scope as that row&apos;s estimate, so it
              can differ from the no-diagnosis view.
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>HOW TO READ THIS</div>
            {db.interpretation.map((line, i) => (
              <div key={i} style={{ fontSize: 9, color: inkSoft, lineHeight: 1.5, marginTop: 2 }}>
                · {line}
              </div>
            ))}
          </div>

          <DashRule />
          <div style={{ fontSize: 10, fontWeight: 600, textAlign: "center" }}>
            Not a diagnosis. Take any concern to a licensed clinician.
          </div>
          <div style={{ fontSize: 8, color: inkSoft, lineHeight: 1.5 }}>
            Source: {db.sources.join("; ")}. {db.population}. Computed estimates, not official
            CDC-published tables. v{db.version} · {db.generated_on}
          </div>
        </div>
      </div>
      <PerforatedEdge pointUp={false} />
    </div>
  );
}

function RowView({ id, c }: { id: string; c: RiskCell }) {
  const kp = knownPresent(c);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 12, color: ink, flex: 1 }}>{shortName(id)}</span>
        {kp ? (
          <span style={{ fontSize: 10, fontWeight: 800, color: stampRed }}>KNOWN PRESENT</span>
        ) : c.pct != null ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: orange }}>{per100(c.pct)} in 100</span>
        ) : null}
      </div>
      {kp ? (
        <div style={{ fontSize: 8, color: inkSoft }}>
          Reported by you — shown as a fact, not a probability.
        </div>
      ) : (
        <>
          {c.base != null && c.chg != null && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: c.chg >= 0 ? stampRed : mintInk,
              }}
            >
              baseline {per100(c.base)} in 100 · {c.chg >= 0 ? "+" : "−"}
              {per100(Math.abs(c.chg))} pp
            </div>
          )}
          <SourceLine c={c} />
        </>
      )}
    </div>
  );
}

function SourceLine({ c }: { c: RiskCell }) {
  const ci = c.lo != null && c.hi != null ? `95% CI ${per100(c.lo)}–${per100(c.hi)} · ` : "";
  const scope = c.scope ? scopeText(c.scope) : "";
  const disc = needsDisclosure(c);
  const mark = disc ? "† " : "";
  return (
    <div style={{ fontSize: 8, color: disc ? blue : inkSoft, lineHeight: 1.5 }}>
      {mark}NHIS {c.yr ?? ""} · n={c.n ?? "—"} · {ci}
      {scope}
    </div>
  );
}
