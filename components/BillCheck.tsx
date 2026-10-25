"use client";

import { useMemo, useState } from "react";
import {
  type AuditedLine,
  type Flag,
  SAMPLE_BILL,
  buildScript,
} from "@/lib/engine";
import {
  Badge,
  Button,
  Card,
  type Column,
  Columns,
  Divider,
  Empty,
  Eyebrow,
  Field,
  Fine,
  H2,
  Hero,
  IconCheck,
  IconFlag,
  IconList,
  Legend,
  ListRow,
  Metric3,
  Note,
  NumberField,
  Num,
  Ring,
  SectionHead,
  Spark,
  Stack,
  Stat,
  StatRow,
  usd,
  usdShort,
} from "@/ui";
import { useApp } from "./AppState";
import { Scan } from "./Scan";

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

interface CatRow {
  key: string;
  billed: number;
  fair: number;
  over: number;
}

export function BillCheck() {
  const {
    audit,
    serious,
    view,
    text,
    setText,
    zip,
    setZip,
    county,
    reviewed,
    toggleReviewed,
    clearReviewed,
    flagKey,
    loadSample,
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

  const open = serious.filter((f) => !reviewed.includes(flagKey(f)));
  const done = serious.filter((f) => reviewed.includes(flagKey(f)));
  const over = audit ? Math.max(0, audit.totalBilled - audit.totalFair) : 0;

  const copyScript = async () => {
    if (!audit) return;
    try {
      await navigator.clipboard.writeText(buildScript(audit, null, county));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  /* ------------------------------------------------------------- the bill */

  if (view === "input") {
    return (
      <Stack>
        <Card>
          <Stack tight>
            <Eyebrow>Where the care happened</Eyebrow>
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
                    ? "Not recognised, national prices used"
                    : "Sets the local price benchmark"
              }
            />
          </Stack>
        </Card>

        <Card>
          <Stack tight>
            <Eyebrow>Add the bill</Eyebrow>
            <Scan />
          </Stack>
        </Card>

        <Card>
          <Stack tight>
            <Field
              label="Itemised bill"
              hint="One line per charge, each with its code and amount. Edit anything the scan read wrongly."
            >
              <textarea
                className="textarea"
                value={text}
                spellCheck={false}
                placeholder={SAMPLE_BILL}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <div className="row">
              <Button small onClick={loadSample}>
                Use the example bill
              </Button>
              {text && (
                <Button small quiet onClick={() => setText("")}>
                  Clear
                </Button>
              )}
            </div>
            <Fine>
              Nothing is uploaded. Parsing, pricing and photo reading happen in this browser, and
              the text stays in local storage on this device.
            </Fine>
          </Stack>
        </Card>
      </Stack>
    );
  }

  if (!audit) {
    return (
      <Card>
        <Empty>No billable lines yet. Scan or paste a bill to see what is worth disputing.</Empty>
      </Card>
    );
  }

  /* --------------------------------------------------------- line by line */

  if (view === "lines") {
    return (
      <Stack>
        <Card flush>
          <div style={{ padding: "14px 16px 6px" }}>
            <SectionHead
              title="Line by line"
              right={<Badge>{audit.lines.length} lines</Badge>}
            />
          </div>
          {audit.lines.map((l: AuditedLine) => (
            <ListRow
              key={l.line.id}
              clip
              icon={<IconList />}
              tone={l.removed ? "danger" : l.overcharge > 0 ? "warn" : "ok"}
              flagged={l.removed}
              title={l.line.description}
              sub={
                <>
                  <Num>{l.line.code}</Num>
                  {l.line.units > 1 ? ` · ${l.line.units} units` : ""}
                  {l.line.date ? ` · ${l.line.date}` : ""}
                </>
              }
              amount={usd(l.line.charge)}
              amountSub={l.line.unknown ? "not priced" : `fair ${usd(l.fairTypical)}`}
              footer={
                l.removed || l.overcharge > 0 ? (
                  <span className="row" style={{ gap: 6, marginTop: 6 }}>
                    {l.removed && <Badge tone="danger">Should not be here</Badge>}
                    {!l.removed && l.overcharge > 0 && (
                      <Badge tone="warn">
                        {usd(l.overcharge)} over
                        {l.ratio > 1 ? ` · ${l.ratio.toFixed(1)}× fair` : ""}
                      </Badge>
                    )}
                  </span>
                ) : undefined
              }
            />
          ))}
        </Card>
        <Fine>
          {audit.pricedLines} of {audit.pricedLines + audit.unknownLines} lines matched the price
          reference. Local index {audit.index.toFixed(2)}
          {county ? ` for ${county.name}` : " (national)"}.
        </Fine>
      </Stack>
    );
  }

  /* -------------------------------------------------------------- findings */

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
              <p className="chart-cap">Running total down the bill, line by line.</p>
            </div>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <SectionHead
            title="To review"
            right={
              <Badge tone={open.length ? "danger" : "ok"}>{open.length || "clear"}</Badge>
            }
          />
          {open.length === 0 ? (
            <Note tone="ok">
              {serious.length === 0
                ? "No lines priced far enough outside the fair range to be worth a call."
                : "Every finding has been through. The call script below still lists them all."}
            </Note>
          ) : (
            <div style={{ margin: "0 -16px" }}>
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
                        <Badge tone={toneFor(f.severity)}>{KIND_LABEL[f.kind] ?? f.kind}</Badge>
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
            <div style={{ margin: "0 -16px" }}>
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
            <Fine>Share of the recoverable total by the kind of problem on the line.</Fine>
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
            <Fine>Tap a column to read what that category was billed.</Fine>
          </Stack>
        </Card>
      )}

      <Card flush>
        <div style={{ padding: "14px 16px 2px" }}>
          <Eyebrow>Billed against fair, by category</Eyebrow>
        </div>
        {cats.map((c) => (
          <div key={c.key}>
            <div className="cat-head">
              <span className="t">{c.key}</span>
            </div>
            <Metric3
              items={[
                { k: "Billed", v: usd(c.billed) },
                { k: "Fair", v: usd(c.fair) },
                c.over > 0
                  ? { k: "Over", v: usd(c.over), tone: "danger" as const }
                  : { k: "Over", v: "—", tone: "ok" as const },
              ]}
            />
          </div>
        ))}
      </Card>

      <Card>
        <Stack tight>
          <StatRow>
            <Stat value={usd(audit.totalBilled)} label="Billed" />
            <Stat value={usd(audit.totalFair)} label="Fair, typical" />
            <Stat value={audit.index.toFixed(2)} label={county ? `Index, ${county.name}` : "Index, national"} />
          </StatRow>
          <Divider />
          <Fine>
            {audit.pricedLines} of {audit.pricedLines + audit.unknownLines} lines matched the price
            reference. Unpriced lines are left out of the totals rather than counted as zero.
          </Fine>
        </Stack>
      </Card>

      <Button wide onClick={copyScript}>
        {copied ? "Script copied" : "Copy the call script"}
      </Button>
    </Stack>
  );
}
