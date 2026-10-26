"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ExpectedValue,
  type ExposureRow,
  type Level,
  type RiskCell,
  type RiskDB,
  LEVEL_LABEL,
  annualEquivalent,
  exposomeFor,
  expectedValue,
  loadRiskDB,
  nationalIndex,
  per100,
  profileKey,
  shortName,
  sumExpected,
  yearsAtRisk,
} from "@/lib/engine";
import {
  Button,
  Card,
  Divider,
  Empty,
  Fine,
  Hero,
  Lede,
  Meter,
  MultiPicker,
  Note,
  NumberField,
  Picker,
  Rail,
  Ring,
  Skeleton,
  Split,
  Stack,
  Stat,
  StatRow,
  useStored,
  useStoredList,
  usd,
  usdShort,
} from "@/ui";
import { useApp } from "./AppState";
import { SlipHead, SlipSection, SlipStage, usePrinted } from "./Slip";

/** The ring has no informational step, so a typical reading uses the series hue. */
const ringTone = (t: "ok" | "info" | "warn" | "danger") => (t === "info" ? "s1" : t);

const TONE: Record<Level, "ok" | "info" | "warn" | "danger"> = {
  low: "ok",
  below: "ok",
  typical: "info",
  elevated: "warn",
  high: "danger",
  severe: "danger",
};

interface Risk {
  id: string;
  cell: RiskCell;
  /** Set when the figure is conditional on something already diagnosed. */
  given?: string;
  diagnosed: boolean;
  ev: ExpectedValue | null;
}

/**
 * Risk Receipt and The Exposome were separate tabs in Billculate. They answer
 * halves of one question — what is likely to go wrong for someone like you,
 * and what living where you live adds on top — so they are one feature here,
 * with the dollar figure both of them produce reported per year.
 */
export function PreventiveCheck() {
  const { zip, setZip, county } = useApp();
  const [db, setDb] = useState<RiskDB | null>(null);
  const [ageId, setAgeId] = useStored("pc_age", "35_44");
  const [raceId, setRaceId] = useStored("pc_race", "");
  const [sexId, setSexId] = useStored("pc_sex", "");
  const [diagnosed, setDiagnosed] = useStoredList("pc_diagnosed");
  const [printedKey, setPrintedKey] = usePrinted<string>("preventive");

  useEffect(() => {
    loadRiskDB().then(setDb);
  }, []);

  // Every profile in the reference is one age band, one race group and one
  // sex: there is no pooled row to fall back on. The age band has a sensible
  // default, but guessing a sex or a race group would put figures on screen
  // that belong to somebody else, so those stay empty until they are chosen.
  // A value left over from an older visit that is no longer an option is
  // cleared rather than silently substituted.
  useEffect(() => {
    if (!db) return;
    if (!db.age_groups.some((g) => g.id === ageId)) setAgeId(db.age_groups[0].id);
    if (sexId && !db.sex_groups.some((g) => g.id === sexId)) setSexId("");
    if (raceId && !db.race_groups.some((g) => g.id === raceId)) setRaceId("");
  }, [db, ageId, sexId, raceId, setAgeId, setSexId, setRaceId]);

  const profileChosen = Boolean(sexId && raceId);

  const profile =
    db && sexId && raceId ? db.profiles[profileKey(ageId, raceId, sexId)] : undefined;
  const years = yearsAtRisk(ageId);

  /**
   * One row per condition on the receipt.
   *
   * With nothing diagnosed the figure is the plain prevalence for this
   * profile. With something diagnosed, a condition that has a conditional cell
   * for it uses that instead, and the strongest single association is the one
   * shown: these are one-condition-at-a-time figures from the survey, so
   * stacking several of them would overstate the result.
   */
  const risks: Risk[] = useMemo(() => {
    if (!db || !profile) return [];

    return db.receipt_conditions
      .map((id): Risk | null => {
        const isDiagnosed = diagnosed.includes(id);
        const base = profile.baseline[id];

        let cell = base;
        let given: string | undefined;

        if (!isDiagnosed) {
          for (const d of diagnosed) {
            const conditional = profile.given?.[d]?.[id];
            if (conditional && typeof conditional.pct === "number") {
              if (!given || (conditional.pct ?? 0) > (cell?.pct ?? 0)) {
                cell = conditional;
                given = d;
              }
            }
          }
        }

        if (!cell || typeof cell.pct !== "number") return null;

        return {
          id,
          cell,
          given,
          diagnosed: isDiagnosed,
          ev: expectedValue(id, ageId, cell.pct, cell.lo, cell.hi, isDiagnosed),
        };
      })
      .filter((r): r is Risk => r !== null)
      .sort((a, b) => (b.ev?.typical ?? 0) - (a.ev?.typical ?? 0));
  }, [db, profile, diagnosed, ageId]);

  const totals = useMemo(
    () => sumExpected(risks.map((r) => r.ev).filter((e): e is ExpectedValue => e !== null)),
    [risks],
  );

  const likely = useMemo(
    () => risks.filter((r) => !r.diagnosed).sort((a, b) => (b.cell.pct ?? 0) - (a.cell.pct ?? 0)).slice(0, 7),
    [risks],
  );
  const carried = risks.filter((r) => r.diagnosed);
  const topPct = likely.length ? (likely[0].cell.pct ?? 1) : 1;

  const exposome = county ? exposomeFor(county, ageId) : null;
  const nationalIdx = nationalIndex();

  const conditionOptions = useMemo(() => {
    if (!db) return [];
    const ids = db.preexisting.length ? db.preexisting : db.receipt_conditions;
    // The reference labels carry their survey definition, which is far too
    // long for a line in a list.
    return ids.map((id) => ({ id, label: shortName(id) }));
  }, [db]);

  // Something diagnosed that the cost model does not cover still does useful
  // work: it conditions the rates of everything else.
  const conditioningOnly = useMemo(
    () => (db ? diagnosed.filter((id) => !db.receipt_conditions.includes(id)) : []),
    [db, diagnosed],
  );

  const perYear = (v: number) => annualEquivalent(v, years);

  if (!db) {
    return (
      <Split
        controls={
          <Stack tight>
            <Skeleton h={18} w="55%" />
            <Skeleton h={12} w="80%" />
            <Skeleton h={120} />
          </Stack>
        }
        results={null}
      />
    );
  }

  const key = profile ? `${ageId}|${sexId}|${raceId}|${[...diagnosed].sort().join(",")}|${county?.fips ?? zip}` : null;
  const stale = printedKey !== null && key !== printedKey;
  const label = (list: { id: string; label: string }[], id: string) => list.find((g) => g.id === id)?.label ?? id;

  const controls = (
    <>
      <Lede>
        What is statistically most likely to affect someone with your profile, what living in your
        county adds on top, and what both are worth per year. Use it to decide what to get screened
        for, not as a diagnosis.
      </Lede>
      <section className="panel-sec">
        <Picker label="Age" options={db.age_groups} value={ageId} onChange={setAgeId} />
        <Picker label="Sex" options={db.sex_groups} value={sexId} onChange={setSexId} />
        <Picker
          label="Race and ethnicity"
          options={db.race_groups}
          value={raceId}
          onChange={setRaceId}
          hint="Reported population statistics, not biology."
        />
        <MultiPicker
          label="Already diagnosed"
          options={conditionOptions}
          value={diagnosed}
          onChange={setDiagnosed}
          placeholder="Nothing selected"
          hint="Anything selected is counted as certain rather than likely, and the other conditions are shown at their rate among people who have it."
        />
      </section>
      <section className="panel-sec">
        <NumberField
          label="ZIP code"
          value={zip}
          onChange={setZip}
          maxLength={5}
          placeholder="e.g. 10001"
          hint={county ? `${county.name}, ${county.stateName}` : "Adds the local exposure picture."}
        />
      </section>
      {!profileChosen ? (
        <Note tone="info">
          Choose a sex and a race group to load the figures. The reference is published one group at a
          time, so there is no combined row to show in the meantime.
        </Note>
      ) : !profile ? (
        <Note tone="warn">No reference data for that combination.</Note>
      ) : null}
      <div className="panel-print">
        <Button primary wide disabled={!key} onClick={() => key && setPrintedKey(key)}>
          {printedKey === null ? "Print receipt" : stale ? "Print it again" : "Printed"}
        </Button>
        {stale && <Fine>The profile has changed since this receipt was printed.</Fine>}
      </div>
      <Fine>
        Population statistics describe groups, not individuals. Nothing here is a prediction about
        you, and none of it leaves this browser.
      </Fine>
    </>
  );

  const slip = profile ? (
    <>
      <SlipHead
        title="Preventive check"
        lines={[
          `${label(db.age_groups, ageId)}, ${label(db.sex_groups, sexId).toLowerCase()}, ${label(db.race_groups, raceId)}.`,
          county ? `Living in ${county.name}, ${county.stateName}.` : "No ZIP code, so no local exposure picture.",
          carried.length > 0 ? `Already diagnosed: ${carried.map((r) => shortName(r.id)).join(", ")}.` : null,
        ]}
      />

      <SlipSection>
        <h3 className="slip-h">Most likely</h3>
        {likely.length === 0 ? (
          <Empty>Nothing reportable for this profile.</Empty>
        ) : (
          <div className="stack-s">
            {likely.map((r) => (
              <div key={r.id}>
                <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 14.5, minWidth: 0 }}>{shortName(r.id)}</span>
                  <span className="spacer num" style={{ fontSize: 14, fontWeight: 650 }}>
                    {per100(r.cell.pct ?? 0)}
                    <span style={{ color: "var(--ink-soft)", fontWeight: 500 }}> per 100</span>
                  </span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <Meter pct={((r.cell.pct ?? 0) / topPct) * 100} />
                </div>
                <p className="fine" style={{ marginTop: 5 }}>
                  {r.given ? (
                    <>
                      among people with {shortName(r.given).toLowerCase()}
                      {typeof r.cell.chg === "number" && (
                        <>
                          , {r.cell.chg >= 0 ? "+" : ""}
                          {r.cell.chg.toFixed(1)} points against {per100(r.cell.base ?? 0)} without it
                        </>
                      )}
                    </>
                  ) : r.cell.lo !== undefined && r.cell.hi !== undefined ? (
                    <>
                      range {per100(r.cell.lo)} to {per100(r.cell.hi)} per 100 people
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        )}
      </SlipSection>

      <SlipSection>
        <h3 className="slip-h">What it costs</h3>
        <Hero
          value={usd(perYear(totals.typical))}
          label={`expected health spending a year, averaged over the next ${years} years`}
          tone="ok"
        />
        <p className="fine" style={{ marginTop: 10, textAlign: "center" }}>
          Between {usd(perYear(totals.low))} and {usd(perYear(totals.high))} a year, pairing the ends
          of the prevalence interval with the ends of the cost band.
        </p>
        <div style={{ marginTop: 14 }}>
          <StatRow two>
            <Stat value={usd(perYear(totals.certainTypical))} label="From what is already diagnosed" />
            <Stat value={usd(perYear(totals.probabilisticTypical))} label="Weighted by how likely the rest are" />
          </StatRow>
        </div>
      </SlipSection>

      {risks.length > 0 && (
        <SlipSection>
          <h3 className="slip-h">Prevalence times cost, per condition</h3>
          <div className="sl-row sl-th pv" aria-hidden>
            <span>Condition</span>
            <span className="n">Per year</span>
          </div>
          {risks.slice(0, 9).map((r) => (
            <div key={r.id} className="sl-row pv">
              <span className="item">
                <span className="item-t">{shortName(r.id)}</span>
                <span className="item-s">
                  {r.diagnosed
                    ? "Diagnosed, counted in full"
                    : `${per100(r.cell.pct ?? 0)} per 100${r.given ? ` with ${shortName(r.given).toLowerCase()}` : ""}`}
                  {r.ev ? ` · ${usdShort(perYear(r.ev.low))} to ${usdShort(perYear(r.ev.high))}` : ""}
                </span>
              </span>
              <span className="n num" style={{ color: r.diagnosed ? "var(--ok)" : undefined }}>
                {r.ev ? usd(perYear(r.ev.typical)) : "—"}
              </span>
            </div>
          ))}
          <p className="slip-note" style={{ marginTop: 12 }}>
            Each figure is the chance of carrying the condition multiplied by what carrying it costs,
            spread evenly across the years ahead at a 3% discount rate. A condition already diagnosed is
            counted at its full cost.
            {conditioningOnly.length > 0 && (
              <>
                {" "}
                {conditioningOnly.map((id) => shortName(id)).join(" and ")}{" "}
                {conditioningOnly.length === 1 ? "has" : "have"} no cost model here, so{" "}
                {conditioningOnly.length === 1 ? "it is" : "they are"} used to adjust the rates above
                rather than priced.
              </>
            )}
          </p>
        </SlipSection>
      )}

      <SlipSection>
        <h3 className="slip-h">
          Where you live{exposome ? `: ${LEVEL_LABEL[exposome.worst.level].toLowerCase()}` : ""}
        </h3>
        {!exposome ? (
          <p className="slip-note">Enter a ZIP code on the left and print again to add the local exposure picture.</p>
        ) : (
          <>
            <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
              <Ring
                pct={exposome.compositeIndex}
                tone={ringTone(TONE[exposome.worst.level])}
                center={exposome.compositeIndex.toFixed(0)}
                label="Burden index"
                size={62}
              />
              <div className="stack-s" style={{ minWidth: 0 }}>
                <Stat
                  value={`${exposome.compositeIndex >= nationalIdx ? "+" : ""}${(
                    exposome.compositeIndex - nationalIdx
                  ).toFixed(0)}`}
                  label="Index points against the national median county"
                />
                <Stat value={usd(annualEquivalent(exposome.typical, exposome.years))} label="Attributable cost a year" />
              </div>
            </div>
            <div className="stack-s" style={{ marginTop: 14 }}>
              {exposome.rows.slice(0, 5).map((r: ExposureRow) => (
                <Rail key={r.domain.id} tone={TONE[r.level]}>
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <strong style={{ fontSize: 14.5 }}>{r.domain.label}</strong>
                    <span className="spacer num" style={{ fontSize: 13.5 }}>
                      {usd(annualEquivalent(r.typical, exposome.years))}/yr
                    </span>
                  </div>
                  <p className="fine" style={{ marginTop: 2 }}>
                    {r.readout}
                  </p>
                </Rail>
              ))}
            </div>
          </>
        )}
      </SlipSection>
    </>
  ) : null;

  return (
    <Split
      controls={controls}
      results={
        <SlipStage
          stage="preventive"
          printKey={printedKey !== null && profile ? printedKey : null}
          idle="Describe a profile on the left, then press Print receipt."
        >
          {slip}
        </SlipStage>
      }
    />
  );
}
