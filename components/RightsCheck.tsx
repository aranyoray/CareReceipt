"use client";

import { type ReactNode, useId, useMemo, useState } from "react";
import {
  type Answer,
  type Coverage,
  type Letter,
  type Mark,
  type Right,
  type RightStatus,
  assessRights,
  daysBetween,
  longDate,
  todayISO,
} from "@/lib/engine";
import { Badge, Button, Fine, Hero, Lede, Note, NumberField, Picker, Rail, Split, type Tone, useStored } from "@/ui";
import { useApp } from "./AppState";
import { SlipHead, SlipSection, SlipStage, usePrinted } from "./Slip";

const COVERAGE = [
  { id: "uninsured", label: "No insurance, or paying myself" },
  { id: "insured", label: "Insurance paid part of it" },
];
const YES_NO = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
const YES_NO_UNSURE = [...YES_NO, { id: "unsure", label: "Not sure" }];

const TONE: Record<RightStatus, Tone> = { act: "warn", check: "info", met: "ok", closed: "danger", none: "neutral" };

function badgeText(r: Right): string {
  const running = r.deadline !== null && r.daysLeft !== null && r.daysLeft >= 0;
  if (r.status === "act") {
    if (!running) return "Do this first";
    return r.daysLeft === 0 ? "Due today" : `${r.daysLeft} days left`;
  }
  if (r.status === "check") return running ? `${r.daysLeft} days left` : "Check";
  if (r.status === "met") return r.id === "collection" ? "In force" : "Done";
  if (r.status === "closed") return "Window closed";
  return "Does not apply";
}

function relative(today: string, day: string): string {
  const d = daysBetween(today, day);
  if (d === 0) return "today";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

/** A native date picker in the same frame as the other fields. */
function DateField({
  label,
  value,
  onChange,
  max,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: string;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input id={id} type="date" className="input" value={value} max={max} onChange={(e) => onChange(e.target.value)} />
      {hint && (
        <p className="fine" style={{ marginTop: 6 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/** The dated points, oldest first, with today among them. */
function Timeline({ marks, today }: { marks: Mark[]; today: string }) {
  return (
    <ol className="tl">
      {marks.map((m, i) => (
        <li key={`${m.date}-${m.label}-${i}`} className={`tl-i ${m.tone}`}>
          <span className="tl-dot" aria-hidden="true" />
          <span className="tl-date num">{longDate(m.date)}</span>
          <span className="tl-label">{m.label}</span>
          <span className="tl-rel">{m.tone === "today" ? "" : relative(today, m.date)}</span>
        </li>
      ))}
    </ol>
  );
}

function LetterBlock({ letter }: { letter: Letter }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rt-letter">
      <div className="row">
        <h4 className="rt-letter-t">{letter.title}</h4>
        <span className="spacer">
          <Button primary small onClick={copy}>
            {copied ? "Letter copied" : "Copy the letter"}
          </Button>
        </span>
      </div>
      <p className="letter-body">{letter.body}</p>
    </div>
  );
}

/**
 * Rights and deadlines.  A few plain questions about the bill go in the panel
 * on the left, with the ZIP code shared with the other screens and the amount
 * billed taken from the checked bill until it is typed over.  Print draws a
 * slip with the next deadline, a dated timeline, each protection that applies
 * and the letter that goes with it.
 */
export function RightsCheck() {
  const { zip, setZip, county, geoReady, audit, go } = useApp();
  const [coverage, setCoverage] = useStored("rt_coverage", "uninsured");
  const [nonprofit, setNonprofit] = useStored("rt_nonprofit", "unsure");
  const [firstBill, setFirstBill] = useStored("rt_first_bill", "");
  const [itemized, setItemized] = useStored("rt_itemized", "no");
  const [collections, setCollections] = useStored("rt_collections", "no");
  const [estimate, setEstimate] = useStored("rt_estimate", "unsure");
  const [estimateAmount, setEstimateAmount] = useStored("rt_estimate_amount", "");
  const [billedTyped, setBilledTyped] = useStored("rt_billed", "");
  const [denial, setDenial] = useStored("rt_denial", "");
  const [printedKey, setPrintedKey] = usePrinted<string>("rights");

  const today = todayISO();
  const fromBill = billedTyped === "" && audit !== null && audit.totalBilled > 0;
  const billed = billedTyped !== "" ? billedTyped : fromBill ? String(Math.round(audit!.totalBilled)) : "";
  const surprise = audit ? audit.flags.some((f) => f.kind === "surprise") : false;
  const insured = coverage === "insured";

  const input = useMemo(
    () => ({
      state: county?.state ?? "",
      coverage: (insured ? "insured" : "uninsured") as Coverage,
      nonprofit: nonprofit as Answer,
      firstBill,
      itemized: itemized as Answer,
      collections: collections as Answer,
      estimate: estimate as Answer,
      estimateAmount: Number(estimateAmount) || 0,
      billed: Number(billed) || 0,
      denial: insured ? denial : "",
      surprise,
      today,
    }),
    [county, insured, nonprofit, firstBill, itemized, collections, estimate, estimateAmount, billed, denial, surprise, today],
  );

  const report = useMemo(() => assessRights(input), [input]);
  const key = county ? JSON.stringify(input) : null;
  const stale = printedKey !== null && key !== printedKey;
  const zipUnknown = geoReady && zip.length === 5 && !county;
  const texas = county?.state === "TX";

  const controls = (
    <>
      <Lede>
        Some of the strongest protections on a medical bill expire quietly. Answer a few questions to see which
        ones apply to this bill, how long you have, and the letter to send.
      </Lede>
      <section className="panel-sec">
        <NumberField
          label="ZIP code"
          value={zip}
          onChange={setZip}
          maxLength={5}
          placeholder="e.g. 75201"
          hint={county ? `${county.name}, ${county.stateName}` : "Sets which state's rules apply."}
        />
        {zipUnknown && <Note tone="warn">That ZIP code is not one we can place in a county.</Note>}
        <Picker label="How was this care paid for?" options={COVERAGE} value={coverage} onChange={setCoverage} />
        <Picker
          label="Is the hospital a nonprofit?"
          options={YES_NO_UNSURE}
          value={nonprofit}
          onChange={setNonprofit}
          hint="A nonprofit hospital has to publish a financial assistance policy on its website."
        />
        <DateField
          label="Date of the first bill"
          value={firstBill}
          onChange={setFirstBill}
          max={today}
          hint="The first bill after the visit or discharge. Most deadlines count from it."
        />
      </section>
      <section className="panel-sec">
        <Picker
          label="Has an itemized bill arrived?"
          options={YES_NO_UNSURE}
          value={itemized}
          onChange={setItemized}
          hint={texas ? "In Texas a provider must send one before it can pursue collection." : "One that lists every service with its code and charge."}
        />
        <Picker label="Has anyone started collecting this bill?" options={YES_NO} value={collections} onChange={setCollections} />
      </section>
      {insured ? (
        <section className="panel-sec">
          <DateField
            label="Date on a denial notice, if any"
            value={denial}
            onChange={setDenial}
            max={today}
            hint="From the insurer's letter or the Explanation of Benefits that shows a denied line."
          />
        </section>
      ) : (
        <section className="panel-sec">
          <Picker
            label="Did the provider give you a good faith estimate?"
            options={YES_NO_UNSURE}
            value={estimate}
            onChange={setEstimate}
            hint="A written estimate given before scheduled care."
          />
          {estimate === "yes" && (
            <>
              <NumberField label="The estimate" value={estimateAmount} onChange={setEstimateAmount} maxLength={7} prefix="$" placeholder="0" />
              <NumberField
                label="That provider's bill"
                value={billed}
                onChange={setBilledTyped}
                maxLength={7}
                prefix="$"
                placeholder="0"
                hint={fromBill ? "Taken from the checked bill. Type over it to change it." : "What the same provider is billing."}
              />
            </>
          )}
        </section>
      )}
      <div className="panel-print">
        <Button primary wide disabled={!key} onClick={() => key && setPrintedKey(key)}>
          {printedKey === null ? "Print receipt" : stale ? "Print it again" : "Printed"}
        </Button>
        {stale && <Fine>The details have changed since this receipt was printed.</Fine>}
      </div>
    </>
  );

  const next = report.next;
  const letters = report.rights.filter((r) => r.letter !== null);

  const slip = county ? (
    <>
      <SlipHead
        title="Rights and deadlines"
        lines={[
          `${county.name}, ${county.stateName}. ${insured ? "Insurance paid part of this bill." : "Uninsured or paying directly."}`,
          firstBill
            ? `First bill dated ${longDate(firstBill)}. Checked on ${longDate(today)}.`
            : `Checked on ${longDate(today)}. Add the date of the first bill to see the deadlines.`,
        ]}
      />

      <SlipSection>
        <h3 className="slip-h">The next deadline</h3>
        {next && next.deadline && next.daysLeft !== null ? (
          <Hero
            value={next.daysLeft === 0 ? "Today" : `${next.daysLeft} days`}
            label={`${next.title}, by ${longDate(next.deadline)}`}
            tone={next.daysLeft <= 14 ? "danger" : undefined}
          />
        ) : (
          <Rail tone="info">
            {firstBill
              ? "No deadline is running on the answers given. Anything that still needs checking is listed below."
              : "Deadlines count from the first bill. Add its date on the left and print again."}
          </Rail>
        )}
      </SlipSection>

      {report.marks.length > 0 && (
        <SlipSection>
          <h3 className="slip-h">Timeline</h3>
          <Timeline marks={report.marks} today={today} />
        </SlipSection>
      )}

      <SlipSection>
        <h3 className="slip-h">What applies to this bill</h3>
        <div className="rt-list">
          {report.rights.map((r) => (
            <Rail key={`${r.id}-${r.title}`} tone={TONE[r.status]}>
              <div className="row">
                <strong className="rt-t">{r.title}</strong>
                <span className="spacer">
                  <Badge tone={TONE[r.status]}>{badgeText(r)}</Badge>
                </span>
              </div>
              <p className="slip-note rt-s">{r.summary}</p>
              {r.steps.length > 0 && (
                <ul className="rt-steps">
                  {r.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
              <p className="fine rt-basis">{r.basis}</p>
              {r.id === "assistance" && r.status !== "check" && (
                <Button quiet small onClick={() => go("help")}>
                  Write the full application on Financial help
                </Button>
              )}
            </Rail>
          ))}
        </div>
      </SlipSection>

      {letters.length > 0 && (
        <SlipSection>
          <h3 className="slip-h">Letters</h3>
          {letters.map((r) => (
            <LetterBlock key={`${r.id}-letter`} letter={r.letter!} />
          ))}
          <p className="slip-note">
            Fill in the bracketed details, send it by email, portal or post, and keep a copy with the date you
            sent it.
          </p>
        </SlipSection>
      )}

      {report.ruledOut.length > 0 && (
        <SlipSection>
          <h3 className="slip-h">Checked, and does not apply</h3>
          {report.ruledOut.map((r) => (
            <p key={`${r.id}-out`} className="slip-note">
              <strong>{r.title}.</strong> {r.summary}
            </p>
          ))}
        </SlipSection>
      )}

      <SlipSection>
        <p className="slip-note">
          This is general information about these rules, not legal advice. Deadlines are counted in calendar
          days from the dates entered here; the dates printed on your own bills and notices are the ones that
          count.
        </p>
      </SlipSection>
    </>
  ) : null;

  return (
    <Split
      controls={controls}
      results={
        <SlipStage
          stage="rights"
          printKey={printedKey !== null && county ? printedKey : null}
          idle="Add a ZIP code and the date of the first bill on the left, then press Print receipt."
        >
          {slip}
        </SlipStage>
      }
    />
  );
}
