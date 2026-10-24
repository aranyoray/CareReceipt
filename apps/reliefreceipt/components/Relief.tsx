"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type County,
  type Eligibility,
  type Geo,
  assessEligibility,
  countyForZip,
  federalPovertyLevel,
  loadGeo,
  loadZipMap,
} from "@receipt/core";
import {
  Badge,
  Button,
  Card,
  Divider,
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
  usd,
  useStored,
} from "@receipt/ui";

const TIER_TONE = { free: "ok", sliding: "warn", unlikely: "danger" } as const;
const TIER_LABEL = {
  free: "Written off in full",
  sliding: "Sliding-scale discount",
  unlikely: "Unlikely on income alone",
} as const;

export function Relief() {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [zipMap, setZipMap] = useState<Record<string, string> | null>(null);
  const [zip, setZip] = useStored("zip", "");
  const [income, setIncome] = useStored("rr_income", "48000");
  const [household, setHousehold] = useStored("rr_household", "3");
  const [owed, setOwed] = useStored("rr_owed", "8400");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([loadGeo(), loadZipMap()]).then(([g, z]) => {
      setGeo(g);
      setZipMap(z);
    });
  }, []);

  const county: County | null = useMemo(() => {
    if (!geo || !zipMap || zip.length < 5) return null;
    return countyForZip(geo, zipMap, zip);
  }, [geo, zipMap, zip]);

  const state = county?.state ?? "";
  const nIncome = Number(income) || 0;
  const nHousehold = Math.max(1, Number(household) || 1);
  const nOwed = Number(owed) || 0;

  const elig: Eligibility | null = useMemo(() => {
    if (!state) return null;
    return assessEligibility(nIncome, nHousehold, state, nOwed);
  }, [nIncome, nHousehold, state, nOwed]);

  const fpl = state ? federalPovertyLevel(nHousehold, state) : 0;

  const letter = elig
    ? [
        `To the billing department,`,
        ``,
        `I am requesting financial assistance under ${elig.rule.programName} for my account.`,
        ``,
        `Household size: ${nHousehold}`,
        `Annual household income: ${usd(nIncome)}`,
        `That is ${elig.fplPct.toFixed(0)}% of the ${new Date().getFullYear()} federal poverty level of ${usd(fpl)} for a household of this size${
          state ? ` in ${county?.stateName}` : ""
        }.`,
        `Balance currently billed: ${usd(nOwed)}`,
        ``,
        elig.tier === "free"
          ? `Your policy provides for full write-off at or below ${elig.rule.freePct}% of the federal poverty level. I am requesting that the balance be written off in full.`
          : elig.tier === "sliding"
            ? `Your policy provides a sliding-scale discount between ${elig.rule.freePct}% and ${elig.rule.discountPct}% of the federal poverty level. I am requesting the discount I qualify for, which I calculate leaves approximately ${usd(elig.estimatedOwed)}.`
            : `I am requesting consideration under the hardship provisions of your policy. Eligibility is assessed per date of service and hardship is judged separately from the income thresholds.`,
        ``,
        `Please confirm in writing what documentation you need and pause collection activity while this application is assessed.`,
        ``,
        `Thank you.`,
      ].join("\n")
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Stack>
      <div>
        <H1>Get a hospital bill reduced or written off</H1>
        <Lede>
          Every non-profit hospital in the US is required to run a financial assistance programme,
          and most people who qualify never apply. Work out what you are entitled to under your
          state&apos;s rules, then send the letter.
        </Lede>
      </div>

      <Split
        controls={
          <Card>
            <Stack tight>
              <Field
                label="ZIP code"
                hint={county ? `${county.name}, ${county.stateName}` : "Sets which state's rules apply"}
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
              <Field label="Annual household income">
                <input
                  className="input num"
                  inputMode="numeric"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label="People in household">
                <input
                  className="input num"
                  inputMode="numeric"
                  value={household}
                  onChange={(e) => setHousehold(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label="Balance owed" hint="After any bill corrections you have already won.">
                <input
                  className="input num"
                  inputMode="numeric"
                  value={owed}
                  onChange={(e) => setOwed(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Fine>
                Everything stays in this browser. Apply even if you think you earn too much —
                eligibility is judged per date of service, can be applied retroactively, and
                hardship provisions sit outside the income thresholds.
              </Fine>
            </Stack>
          </Card>
        }
        results={
          !elig ? (
            <Card>
              <Note tone="info">Enter a ZIP code to load your state&apos;s assistance rules.</Note>
            </Card>
          ) : (
            <>
              <Card raised>
                <Stack tight>
                  <div className="row">
                    <Eyebrow>Your position</Eyebrow>
                    <span style={{ marginLeft: "auto" }}>
                      <Badge tone={TIER_TONE[elig.tier]}>{TIER_LABEL[elig.tier]}</Badge>
                    </span>
                  </div>
                  <StatRow>
                    <Stat value={`${elig.fplPct.toFixed(0)}%`} label="of federal poverty level" />
                    <Stat value={usd(fpl)} label={`FPL, household of ${nHousehold}`} />
                    <Stat
                      value={
                        <span style={{ color: elig.estimatedOwed < nOwed ? "var(--ok)" : undefined }}>
                          {usd(elig.estimatedOwed)}
                        </span>
                      }
                      label="Estimated after assistance"
                    />
                  </StatRow>
                  <Divider />
                  <Rail tone={TIER_TONE[elig.tier]}>
                    <strong>{elig.headline}</strong>
                  </Rail>
                </Stack>
              </Card>

              <Card>
                <Stack tight>
                  <H2>{county?.stateName} rules</H2>
                  <div style={{ margin: "0 -18px" }}>
                    <LineItem label="Programme" amount={elig.rule.programName} />
                    <LineItem
                      label="Free care at or below"
                      amount={`${elig.rule.freePct}% FPL`}
                      sub={`${usd((fpl * elig.rule.freePct) / 100)} for your household`}
                    />
                    <LineItem
                      label="Sliding scale up to"
                      amount={`${elig.rule.discountPct}% FPL`}
                      sub={`${usd((fpl * elig.rule.discountPct) / 100)} for your household`}
                    />
                  </div>
                  <Note tone="info">{elig.rule.note}</Note>
                  {elig.rule.assetNote && <Note tone="warn">{elig.rule.assetNote}</Note>}
                </Stack>
              </Card>

              <Card>
                <Stack tight>
                  <div className="row">
                    <H2>Your application letter</H2>
                    <span style={{ marginLeft: "auto" }}>
                      <Button onClick={copy}>{copied ? "Copied" : "Copy letter"}</Button>
                    </span>
                  </div>
                  <textarea className="textarea" readOnly value={letter} style={{ minHeight: 280 }} />
                  <Fine>
                    Send it to the billing department in writing and keep a copy. Ask them to pause
                    collection activity while the application is assessed.
                  </Fine>
                </Stack>
              </Card>
            </>
          )
        }
      />
    </Stack>
  );
}
