"use client";

import { useMemo, useState } from "react";
import { type County, type Eligibility, assessEligibility, federalPovertyLevel } from "@/lib/engine";
import { Button, Fine, Hero, Lede, Metric3, Note, NumberField, Picker, Rail, Split, Stat, StatRow, usd, useStored } from "@/ui";
import { useApp } from "./AppState";
import { SlipHead, SlipSection, SlipStage, usePrinted } from "./Slip";

const HOUSEHOLD = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  label: `${i + 1} ${i === 0 ? "person" : "people"}`,
}));

const TIER_TONE = { free: "ok", sliding: "warn", unlikely: "danger" } as const;
const TIER_LABEL = {
  free: "Written off in full",
  sliding: "Sliding-scale discount",
  unlikely: "Unlikely on income alone",
} as const;

/**
 * Where this household sits against its state's two thresholds: everything
 * below the free line is written off, everything up to the discount line is
 * reduced, and the marker is the household.
 */
function FplBands({ freePct, discountPct, fplPct }: { freePct: number; discountPct: number; fplPct: number }) {
  const max = Math.max(discountPct * 1.25, fplPct * 1.1, 100);
  const w = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  return (
    <div>
      <div className="meter" style={{ position: "relative", height: 14, overflow: "visible" }}>
        <span style={{ width: w(freePct), background: "var(--ok)", height: "100%", borderRadius: "999px 0 0 999px" }} />
        <span className="meter-gap" />
        <span style={{ width: `calc(${w(discountPct - freePct)} - 2px)`, background: "var(--warn)", height: "100%" }} />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `calc(${w(fplPct)} - 1.5px)`,
            top: -4,
            width: 3,
            height: 22,
            borderRadius: 2,
            background: "var(--ink)",
            boxShadow: "0 0 0 2px var(--surface)",
          }}
        />
      </div>
      <div className="legend" style={{ marginTop: 10 }}>
        <span className="legend-i" style={{ color: "var(--ink)" }}>
          <span className="legend-sw" style={{ background: "var(--ok)" }} /> Free to {freePct}% of the poverty level
        </span>
        {discountPct > freePct && (
          <span className="legend-i" style={{ color: "var(--ink)" }}>
            <span className="legend-sw" style={{ background: "var(--warn)" }} /> Discounted to {discountPct}%
          </span>
        )}
        <span className="legend-i" style={{ color: "var(--ink)" }}>
          <span className="legend-sw" style={{ background: "var(--ink)" }} /> This household, {Math.round(fplPct)}%
        </span>
      </div>
    </div>
  );
}

interface Assessed {
  elig: Eligibility;
  fpl: number;
  nIncome: number;
  nHousehold: number;
  nOwed: number;
  letter: string;
}

function assess(county: County, income: number, household: number, owed: number): Assessed {
  const elig = assessEligibility(income, household, county.state, owed);
  const fpl = federalPovertyLevel(household, county.state);
  const letter = [
    `To the billing department,`,
    ``,
    `I am requesting financial assistance under ${elig.rule.programName} for my account.`,
    ``,
    `Household size: ${household}`,
    `Annual household income: ${usd(income)}`,
    `That is ${elig.fplPct.toFixed(0)}% of the ${new Date().getFullYear()} federal poverty level of ${usd(fpl)} for a household of this size in ${county.stateName}.`,
    `Balance currently billed: ${usd(owed)}`,
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
  ].join("\n");
  return { elig, fpl, nIncome: income, nHousehold: household, nOwed: owed, letter };
}

/**
 * Financial help.  The household's details go in the panel on the left, with
 * the ZIP code, income and household shared with Bill check and the balance
 * taken from the checked bill until it is typed over.  Print draws the
 * assessment and the application letter out of the sleeve on the right.
 */
export function FinancialHelp() {
  const { zip, setZip, county, geoReady, income, setIncome, household, setHousehold, audit, owed } = useApp();
  const [balanceTyped, setBalanceTyped] = useStored("cr_balance", "");
  const [printedKey, setPrintedKey] = usePrinted<string>("help");
  const [copied, setCopied] = useState(false);

  const fromBill = balanceTyped === "" && audit !== null && owed > 0;
  const balance = balanceTyped !== "" ? balanceTyped : fromBill ? String(Math.round(owed)) : "";

  const nIncome = Number(income.replace(/\D/g, "")) || 0;
  const nHousehold = Math.max(1, Number(household) || 1);
  const nOwed = Number(balance.replace(/\D/g, "")) || 0;

  const result = useMemo(
    () => (county ? assess(county, nIncome, nHousehold, nOwed) : null),
    [county, nIncome, nHousehold, nOwed],
  );

  const key = county && nIncome > 0 ? `${county.fips}|${nIncome}|${nHousehold}|${nOwed}` : null;
  const stale = printedKey !== null && key !== printedKey;

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.letter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const zipUnknown = geoReady && zip.length === 5 && !county;

  const controls = (
    <>
      <Lede>
        Every non-profit hospital in the US has to run a financial assistance programme, and most
        people who qualify never apply. See what this household is entitled to under its state&apos;s
        rules, then send the letter.
      </Lede>
      <section className="panel-sec">
        <NumberField
          label="ZIP code"
          value={zip}
          onChange={setZip}
          maxLength={5}
          placeholder="e.g. 10001"
          hint={county ? `${county.name}, ${county.stateName}` : "Sets which state's rules apply."}
        />
        {zipUnknown && <Note tone="warn">That ZIP code is not one we can place in a county.</Note>}
        <NumberField label="Household income a year" value={income} onChange={setIncome} maxLength={7} prefix="$" placeholder="0" />
        <Picker label="Household size" options={HOUSEHOLD} value={household} onChange={setHousehold} />
        <NumberField
          label="Balance owed"
          value={balance}
          onChange={setBalanceTyped}
          maxLength={7}
          prefix="$"
          placeholder="0"
          hint={
            fromBill
              ? "Taken from the checked bill, after the disputes. Type over it to change it."
              : "What the hospital is asking for now."
          }
        />
      </section>
      <div className="panel-print">
        <Button primary wide disabled={!key} onClick={() => key && setPrintedKey(key)}>
          {printedKey === null ? "Print receipt" : stale ? "Print it again" : "Printed"}
        </Button>
        {stale && <Fine>The details have changed since this receipt was printed.</Fine>}
      </div>
      <Fine>
        Apply even if you think you earn too much: eligibility is judged per date of service, can be
        applied retroactively, and hardship provisions sit outside the income test. Nothing here leaves
        this browser.
      </Fine>
    </>
  );

  const slip =
    result && county ? (
      <>
        <SlipHead
          title="Financial help"
          lines={[
            `${county.name}, ${county.stateName}. Household of ${result.nHousehold} on ${usd(result.nIncome)} a year.`,
            `Assessed under the ${result.elig.rule.programName}.`,
          ]}
        />

        <SlipSection>
          <h3 className="slip-h">What you would pay</h3>
          <Hero
            value={usd(result.elig.estimatedOwed)}
            label={`estimated balance after assistance, from ${usd(result.nOwed)} billed`}
            tone={result.elig.estimatedOwed < result.nOwed ? "ok" : undefined}
          />
          <div style={{ marginTop: 14 }}>
            <Rail tone={TIER_TONE[result.elig.tier]}>
              <strong>{TIER_LABEL[result.elig.tier]}.</strong> {result.elig.headline}
            </Rail>
          </div>
        </SlipSection>

        <SlipSection>
          <h3 className="slip-h">Against the poverty level</h3>
          <FplBands freePct={result.elig.rule.freePct} discountPct={result.elig.rule.discountPct} fplPct={result.elig.fplPct} />
          <div style={{ marginTop: 16 }}>
            <StatRow>
              <Stat value={`${result.elig.fplPct.toFixed(0)}%`} label="of the poverty level" />
              <Stat value={usd(result.fpl)} label={`poverty level, household of ${result.nHousehold}`} />
              <Stat value={`${Math.round(result.elig.patientShare * 100)}%`} label="share you would pay" />
            </StatRow>
          </div>
        </SlipSection>

        <SlipSection>
          <h3 className="slip-h">{county.stateName} rules</h3>
          <Metric3
            items={[
              { k: "Free below", v: usd((result.fpl * result.elig.rule.freePct) / 100) },
              { k: "Discount below", v: usd((result.fpl * result.elig.rule.discountPct) / 100) },
              { k: "Your income", v: usd(result.nIncome) },
            ]}
          />
          <p className="slip-note" style={{ marginTop: 12 }}>
            {result.elig.rule.note}
            {result.elig.rule.assetNote ? ` ${result.elig.rule.assetNote}` : ""}
          </p>
        </SlipSection>

        <SlipSection>
          <div className="row">
            <h3 className="slip-h" style={{ margin: 0 }}>
              Your application letter
            </h3>
            <span className="spacer">
              <Button primary small onClick={copy}>
                {copied ? "Letter copied" : "Copy the letter"}
              </Button>
            </span>
          </div>
          <p className="letter-body" id="letter-text">
            {result.letter}
          </p>
          <p className="slip-note">
            Send it to the billing department by email or post and keep a copy. Ask which dates of service
            it covers, and for collection to pause while it is assessed.
          </p>
        </SlipSection>
      </>
    ) : null;

  return (
    <Split
      controls={controls}
      results={
        <SlipStage
          stage="help"
          printKey={printedKey !== null && result ? printedKey : null}
          idle="Add a ZIP code and household income on the left, then press Print receipt."
        >
          {slip}
        </SlipStage>
      }
    />
  );
}
