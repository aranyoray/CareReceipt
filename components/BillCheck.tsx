"use client";

import { useMemo, useState } from "react";
import { type Audit, type Eligibility, type Flag, buildScript } from "@/lib/engine";
import {
  Button,
  Card,
  type Column,
  Columns,
  Divider,
  Field,
  Fine,
  H2,
  Hero,
  IconCheck,
  IconFlag,
  Lede,
  Legend,
  ListRow,
  Note,
  NumberField,
  Picker,
  Ring,
  SectionHead,
  Spark,
  Split,
  Stack,
  Stat,
  StatRow,
  usd,
  usdShort,
} from "@/ui";
import { useApp } from "./AppState";
import { Scan } from "./Scan";
import { SlipHead, SlipSection, SlipStage, usePrinted } from "./Slip";

const toneFor = (s: Flag["severity"]) => (s === "high" ? "danger" : s === "medium" ? "warn" : "info");

const KIND_LABEL: Record<string, string> = {
  overcharge: "Priced over",
  unbundling: "Unbundled",
  duplicate: "Duplicate",
  units: "Unit count",
  upcoding: "Upcoded",
  facility: "Facility fee",
  modifier: "Modifier",
  unknown_code: "Unpriced",
  surprise: "Out of network",
};

const HOUSEHOLD = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  label: `${i + 1} ${i === 0 ? "person" : "people"}`,
}));

interface CatRow {
  key: string;
  billed: number;
  fair: number;
  over: number;
}

const auditKey = (a: Audit | null) =>
  a ? `${a.lines.length}:${Math.round(a.totalBilled)}:${a.index.toFixed(2)}` : null;

/**
 * The bill workspace.  Everything that goes into the bill sits in the panel on
 * the left; Print receipt draws the checked bill out of its sleeve on the
 * right, and the findings, charity care and call script follow beneath it.
 */
export function BillCheck() {
  const { audit } = useApp();
  const [printedKey, setPrintedKey] = usePrinted<string>("bill");
  const key = auditKey(audit);
  const stale = printedKey !== null && key !== printedKey;

  return (
    <Split
      controls={
        <>
          <Lede>
            Photograph or paste an itemised hospital bill. Every line is priced against what the
            procedure actually costs where the care happened.
          </Lede>
          <BillInputs />
          <div className="panel-print">
            <Button primary wide disabled={!key} onClick={() => key && setPrintedKey(key)}>
              {printedKey === null ? "Print receipt" : stale ? "Print it again" : "Printed"}
            </Button>
            {!key && <Fine>Add a bill with at least one coded charge to print it.</Fine>}
            {stale && <Fine>The bill has changed since this receipt was printed.</Fine>}
          </div>
        </>
      }
      results={
        <SlipStage
          stage="bill"
          printKey={printedKey !== null && audit ? printedKey : null}
          idle="Add a bill on the left, or use the example, then press Print receipt."
          after={audit ? <Findings /> : null}
        >
          {audit && <BillSlip />}
        </SlipStage>
      }
    />
  );
}

/* ------------------------------------------------------------------ inputs */

function BillInputs() {
  const { audit, text, setText, zip, setZip, county, income, setIncome, household, setHousehold, loadSample } =
    useApp();

  return (
    <>
      <section className="panel-sec">
        <H2>The bill</H2>
        <Scan />
        <Field
          label="Itemised bill"
          hint="One line per charge, each with its code and amount. Edit anything the scan read wrongly."
        >
          <textarea
            className="textarea"
            value={text}
            spellCheck={false}
            placeholder="Paste the itemised bill here"
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
        <div className="row">
          <Button small onClick={loadSample}>
            Try it with an example bill
          </Button>
          {text && (
            <Button small quiet onClick={() => setText("")}>
              Clear
            </Button>
          )}
        </div>
      </section>

      <section className="panel-sec">
        <H2>Where the care happened</H2>
        <NumberField
          label="ZIP code"
          value={zip}
          onChange={setZip}
          maxLength={5}
          placeholder="e.g. 10001"
          hint={
            county
              ? `${county.name}, ${county.stateName}. Local price index ${audit ? audit.index.toFixed(2) : "—"}.`
              : zip.length >= 5
                ? "Not recognised, national prices used."
                : "Sets the local price benchmark. Without it prices are national."
          }
        />
      </section>

      <section className="panel-sec">
        <H2>For charity care</H2>
        <NumberField
          label="Household income a year"
          value={income}
          onChange={setIncome}
          maxLength={7}
          prefix="$"
          hint="Tested against the state's financial assistance rules. Optional."
        />
        <Picker label="Household size" options={HOUSEHOLD} value={household} onChange={setHousehold} />
      </section>

    </>
  );
}

/* --------------------------------------------------------------- the slip */

function BillSlip() {
  const { audit, county } = useApp();
  if (!audit) return null;
  const over = Math.max(0, audit.totalBilled - audit.totalFair);
  const date = audit.lines.find((l) => l.line.date)?.line.date;

  return (
    <>
      <SlipHead
        title="Itemised bill, checked"
        lines={[
          `${audit.lines.length} ${audit.lines.length === 1 ? "line" : "lines"}${date ? `, care on ${date}` : ""}. ${
            audit.pricedLines
          } matched the price reference.`,
          county
            ? `Priced for ${county.name}, ${county.stateName}, local index ${audit.index.toFixed(2)}.`
            : "Priced at national rates. Add a ZIP code for local ones.",
        ]}
      />

      <SlipSection>
        <div className="sl-row sl-th" aria-hidden>
          <span className="u">Units</span>
          <span>Charge</span>
          <span className="n">Billed</span>
          <span className="n">Fair</span>
        </div>
        {audit.lines.map((l) => (
          <div key={l.line.id} className={l.removed ? "sl-row struck" : "sl-row"}>
            <span className="u num">{l.line.units}</span>
            <span className="item">
              <span className="item-t">{l.proc?.name ?? l.line.description}</span>
              <span
                className={
                  l.removed ? "item-s danger" : l.overcharge > 0 ? "item-s warn" : "item-s"
                }
              >
                {l.line.code}
                {l.line.date ? ` · ${l.line.date}` : ""}
                {l.removed
                  ? " · should not be on the bill"
                  : l.line.unknown
                    ? " · not in the price reference"
                    : l.overcharge > 0
                      ? ` · ${usd(l.overcharge)} over${l.ratio > 1 ? `, ${l.ratio.toFixed(1)}× fair` : ""}`
                      : " · within the fair range"}
              </span>
            </span>
            <span className="n num">{usd(l.line.charge)}</span>
            <span className="n num">{l.line.unknown ? "—" : usd(l.removed ? 0 : l.fairTypical)}</span>
          </div>
        ))}
      </SlipSection>

      <SlipSection>
        <div className="sl-total">
          <span>Billed</span>
          <span className="num">{usd(audit.totalBilled)}</span>
        </div>
        <div className="sl-total">
          <span>Fair, typical for this care</span>
          <span className="num">{usd(audit.totalFair)}</span>
        </div>
        <div className="sl-total">
          <span>Charged above the fair range</span>
          <span className="num">{usd(over)}</span>
        </div>
        <div className="sl-total big">
          <span>Plausibly recoverable</span>
          <span className={audit.totalRecoverable > 0 ? "num danger" : "num ok"}>
            {usd(audit.totalRecoverable)}
          </span>
        </div>
      </SlipSection>
    </>
  );
}

/* --------------------------------------------------------------- findings */

function Findings() {
  const {
    audit,
    serious,
    county,
    reviewed,
    toggleReviewed,
    clearReviewed,
    flagKey,
    owed,
    eligibility,
    go,
  } = useApp();
  const [copied, setCopied] = useState(false);

  const cats: CatRow[] = useMemo(() => {
    if (!audit) return [];
    const by = new Map<string, CatRow>();
    for (const l of audit.lines) {
      const key = l.proc?.category ?? "Other";
      const row = by.get(key) ?? { key, billed: 0, fair: 0, over: 0 };
      row.billed += l.line.charge;
      row.over += l.removed ? l.line.charge : Math.max(0, l.line.charge - l.fairTypical);
      row.fair += l.removed ? 0 : l.fairTypical;
      by.set(key, row);
    }
    return [...by.values()].sort((a, b) => b.billed - a.billed);
  }, [audit]);

  const columns: Column[] = cats.map((c) => ({
    key: c.key,
    label: c.key,
    // The two parts stack to what was billed, so the column height is the
    // charge and the upper segment is the part above the benchmark.
    fair: Math.max(0, c.billed - c.over),
    over: c.over,
  }));

  const running = useMemo(() => {
    if (!audit) return null;
    const billed: number[] = [];
    const fair: number[] = [];
    let b = 0;
    let f = 0;
    for (const l of audit.lines) {
      b += l.line.charge;
      f += l.removed ? 0 : l.fairTypical;
      billed.push(b);
      fair.push(f);
    }
    return { billed, fair };
  }, [audit]);

  const byKind = useMemo(() => {
    const by = new Map<string, number>();
    for (const f of serious) by.set(f.kind, (by.get(f.kind) ?? 0) + f.recoverable);
    return [...by.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [serious]);

  if (!audit) return null;

  const open = serious.filter((f) => !reviewed.includes(flagKey(f)));
  const done = serious.filter((f) => reviewed.includes(flagKey(f)));
  const over = Math.max(0, audit.totalBilled - audit.totalFair);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(buildScript(audit, eligibility, county));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Stack>
      <Card raised>
        <Stack>
          <Hero
            value={usd(audit.totalRecoverable)}
            label={`plausibly recoverable from ${usd(audit.totalBilled)} billed`}
            tone={audit.totalRecoverable > 0 ? "danger" : "ok"}
          />
          {running && (
            <div>
              <Spark
                series={[
                  { label: "Fair", points: running.fair, slot: "s1" },
                  { label: "Billed", points: running.billed, slot: "s2" },
                ]}
                callout={over > 0 ? `${usdShort(over)} over` : "within range"}
              />
              <div style={{ marginTop: 10 }}>
                <Legend
                  items={[
                    { label: "Fair range", swatch: "s1" },
                    { label: "Billed", swatch: "s2" },
                  ]}
                />
              </div>
            </div>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <H2>{open.length ? `${open.length} ${open.length === 1 ? "finding" : "findings"} to review` : "Findings"}</H2>
          {open.length === 0 ? (
            <Note tone="ok">
              {serious.length === 0
                ? "No lines priced far enough outside the fair range to be worth a call."
                : "Every finding has been through. The call script below still lists them all."}
            </Note>
          ) : (
            <div className="bleed">
              {open.map((f) => {
                const key = flagKey(f);
                return (
                  <ListRow
                    key={key}
                    icon={<IconFlag />}
                    tone={toneFor(f.severity)}
                    title={f.title}
                    sub={f.detail}
                    amount={f.recoverable > 0 ? usd(f.recoverable) : undefined}
                    footer={
                      <span className="row" style={{ gap: 8, marginTop: 8 }}>
                        <span className={`kind ${toneFor(f.severity)}`}>{KIND_LABEL[f.kind] ?? f.kind}</span>
                        <span className="spacer">
                          <Button small onClick={() => toggleReviewed(key)}>
                            <IconCheck size={16} /> Mark reviewed
                          </Button>
                        </span>
                      </span>
                    }
                  />
                );
              })}
            </div>
          )}
        </Stack>
      </Card>

      {done.length > 0 && (
        <Card>
          <Stack tight>
            <SectionHead
              title="Reviewed"
              right={
                <Button small quiet onClick={clearReviewed}>
                  Undo all
                </Button>
              }
            />
            <div className="bleed">
              {done.map((f) => {
                const key = flagKey(f);
                return (
                  <ListRow
                    key={key}
                    icon={<IconCheck />}
                    tone="ok"
                    title={f.title}
                    amount={f.recoverable > 0 ? usd(f.recoverable) : undefined}
                    onClick={() => toggleReviewed(key)}
                  />
                );
              })}
            </div>
          </Stack>
        </Card>
      )}

      {byKind.length > 0 && (
        <Card>
          <Stack tight>
            <H2>Where the money is</H2>
            <div className="dials">
              {byKind.map(([kind, amount]) => (
                <Ring
                  key={kind}
                  pct={(amount / Math.max(audit.totalRecoverable, 1)) * 100}
                  tone="s2"
                  center={usdShort(amount)}
                  label={KIND_LABEL[kind] ?? kind}
                />
              ))}
            </div>
          </Stack>
        </Card>
      )}

      {columns.length > 1 && (
        <Card>
          <Stack tight>
            <H2>By category</H2>
            <Columns data={columns} format={usd} />
            <Legend
              items={[
                { label: "Fair range", swatch: "s1" },
                { label: "Above it", swatch: "s2" },
              ]}
            />
          </Stack>
        </Card>
      )}

      <Card>
        <Stack tight>
          <StatRow>
            <Stat value={usd(audit.totalBilled)} label="Billed" />
            <Stat value={usd(audit.totalFair)} label="Fair, typical" />
            <Stat value={audit.index.toFixed(2)} label={county ? `Index, ${county.name}` : "Index, national"} />
          </StatRow>
          <Divider />
        </Stack>
      </Card>

      <CharityCard eligibility={eligibility} owed={owed} hasCounty={county !== null} onApply={() => go("help")} />

      <Card>
        <Stack tight>
          <H2>The call script</H2>
          <Button primary wide onClick={copyScript}>
            {copied ? "Script copied" : "Copy the call script"}
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}

/**
 * Charity care sits with the findings: the number that matters is what is left
 * after both the disputes and the assistance. Financial help carries the full
 * assessment and the application letter.
 */
function CharityCard({
  eligibility,
  owed,
  hasCounty,
  onApply,
}: {
  eligibility: Eligibility | null;
  owed: number;
  hasCounty: boolean;
  onApply: () => void;
}) {
  const e = eligibility;

  return (
    <Card>
      <Stack tight>
        <H2>Charity care</H2>
        {!e ? (
          <Note tone="info">
            Add a household income {hasCounty ? "" : "and a ZIP code "}on the left to test this bill
            against the state&apos;s financial assistance rules.
          </Note>
        ) : (
          <>
            <p className="charity-lead">
              {e.headline} Ask for the {e.rule.programName}.
            </p>
            <Divider />
            <StatRow two>
              <Stat value={usd(owed)} label="Left after the disputes" />
              <Stat value={usd(e.estimatedOwed)} label="Estimated to pay with assistance" />
            </StatRow>
            <div>
              <Button small onClick={onApply}>
                Write the application letter
              </Button>
            </div>
          </>
        )}
      </Stack>
    </Card>
  );
}
