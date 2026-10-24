"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type County,
  type ExposureRow,
  type Geo,
  type Level,
  type RiskDB,
  LEVEL_LABEL,
  countyForZip,
  exposomeFor,
  loadGeo,
  loadRiskDB,
  loadZipMap,
  nationalBaseline,
  per100,
  profileKey,
  shortName,
} from "@receipt/core";
import {
  Badge,
  Card,
  Chips,
  Divider,
  Empty,
  Eyebrow,
  Field,
  Fine,
  H1,
  H2,
  Lede,
  LineItem,
  Note,
  Rail,
  Split,
  Stack,
  Stat,
  StatRow,
  usdShort,
  useStored,
} from "@receipt/ui";

const TONE: Record<Level, "ok" | "info" | "warn" | "danger"> = {
  low: "ok",
  below: "ok",
  typical: "info",
  elevated: "warn",
  high: "danger",
  severe: "danger",
};

/**
 * Risk Receipt and The Exposome were two separate tabs in Billculate. They
 * answer halves of one question — what is likely to go wrong for someone like
 * you, and what where you live adds on top — so they are one feature here.
 */
export function PreventiveCheck() {
  const [db, setDb] = useState<RiskDB | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [zipMap, setZipMap] = useState<Record<string, string> | null>(null);
  const [zip, setZip] = useStored("zip", "");
  const [ageId, setAgeId] = useStored("pc_age", "35_44");
  const [raceId, setRaceId] = useStored("pc_race", "all");
  const [sexId, setSexId] = useStored("pc_sex", "all");

  useEffect(() => {
    loadRiskDB().then(setDb);
    Promise.all([loadGeo(), loadZipMap()]).then(([g, z]) => {
      setGeo(g);
      setZipMap(z);
    });
  }, []);

  const county: County | null = useMemo(() => {
    if (!geo || !zipMap || zip.length < 5) return null;
    return countyForZip(geo, zipMap, zip);
  }, [geo, zipMap, zip]);

  const profile = db ? db.profiles[profileKey(ageId, raceId, sexId)] : undefined;

  const topRisks = useMemo(() => {
    if (!db || !profile) return [];
    return db.receipt_conditions
      .map((id) => ({ id, cell: profile.baseline[id] }))
      .filter((r) => r.cell && typeof r.cell.pct === "number")
      .sort((a, b) => (b.cell!.pct ?? 0) - (a.cell!.pct ?? 0))
      .slice(0, 8);
  }, [db, profile]);

  const exposome = county ? exposomeFor(county, ageId) : null;
  const national = nationalBaseline(ageId);

  if (!db) {
    return (
      <Card>
        <Empty>Loading the reference data…</Empty>
      </Card>
    );
  }

  return (
    <Stack>
      <div>
        <div className="row">
          <H1>Preventive check</H1>
          <Badge tone="new">New</Badge>
        </div>
        <Lede>
          What is statistically most likely to affect someone with your profile, plus what living in
          your county adds on top. Use it to decide what to actually get screened for — not as a
          diagnosis.
        </Lede>
      </div>

      <Split
        controls={
          <Card>
            <Stack tight>
              <Field label="Age">
                <Chips options={db.age_groups} value={ageId} onChange={setAgeId} />
              </Field>
              <Field label="Sex">
                <Chips options={db.sex_groups} value={sexId} onChange={setSexId} />
              </Field>
              <Field label="Race / ethnicity" hint="Reflects reported population statistics, not biology.">
                <Chips options={db.race_groups} value={raceId} onChange={setRaceId} />
              </Field>
              <Divider />
              <Field
                label="ZIP code"
                hint={county ? `${county.name}, ${county.stateName}` : "Adds the local exposure picture"}
              >
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={5}
                  value={zip}
                  placeholder="e.g. 10001"
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Fine>
                Population statistics describe groups, not individuals. Nothing here is a prediction
                about you, and none of it leaves this browser.
              </Fine>
            </Stack>
          </Card>
        }
        results={
          <>
            <Card raised>
              <Stack tight>
                <Eyebrow>Most likely for this profile</Eyebrow>
                {!profile ? (
                  <Note tone="warn">
                    No reference data for that combination. Try a broader race or sex selection.
                  </Note>
                ) : topRisks.length === 0 ? (
                  <Empty>Nothing reportable for this profile.</Empty>
                ) : (
                  <div style={{ margin: "0 -18px -18px" }}>
                    {topRisks.map(({ id, cell }) => (
                      <LineItem
                        key={id}
                        label={shortName(id)}
                        amount={<>{per100(cell!.pct ?? 0)}</>}
                        sub={
                          cell!.lo !== undefined && cell!.hi !== undefined
                            ? `range ${per100(cell!.lo)} – ${per100(cell!.hi)} per 100 people`
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </Stack>
            </Card>

            <Card>
              <Stack tight>
                <div className="row">
                  <H2>Where you live</H2>
                  {exposome && (
                    <span style={{ marginLeft: "auto" }}>
                      <Badge tone={TONE[exposome.worst.level]}>
                        {LEVEL_LABEL[exposome.worst.level]}
                      </Badge>
                    </span>
                  )}
                </div>
                {!exposome ? (
                  <Note tone="info">Enter a ZIP code to add the local exposure picture.</Note>
                ) : (
                  <>
                    <StatRow>
                      <Stat value={exposome.compositeIndex.toFixed(0)} label="Burden index (0–100)" />
                      <Stat
                        value={`${exposome.compositeIndex >= national ? "+" : ""}${(
                          exposome.compositeIndex - national
                        ).toFixed(0)}`}
                        label="vs national median"
                      />
                      <Stat value={usdShort(exposome.typical)} label={`Typical cost, ${exposome.years} yr`} />
                    </StatRow>
                    <Divider />
                    <Stack tight>
                      {exposome.rows
                        .slice()
                        .sort((a: ExposureRow, b: ExposureRow) => b.index - a.index)
                        .slice(0, 5)
                        .map((r) => (
                          <Rail key={r.domain.id} tone={TONE[r.level]}>
                            <div className="row">
                              <strong>{r.domain.label}</strong>
                              <span style={{ marginLeft: "auto" }} className="num">
                                {r.index.toFixed(0)}
                              </span>
                              <Badge tone={TONE[r.level]}>{LEVEL_LABEL[r.level]}</Badge>
                            </div>
                            <p className="fine" style={{ marginTop: 2 }}>
                              {r.readout}
                            </p>
                          </Rail>
                        ))}
                    </Stack>
                  </>
                )}
              </Stack>
            </Card>
          </>
        }
      />
    </Stack>
  );
}
