"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Audit,
  type AuditedLine,
  type County,
  type Flag,
  type Geo,
  SAMPLE_BILL,
  auditBill,
  countyForZip,
  loadGeo,
  loadZipMap,
  parseBill,
} from "@receipt/core";
import {
  Badge,
  Button,
  Card,
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
  Num,
  Rail,
  Split,
  Stack,
  Stat,
  StatRow,
  usd,
  useDebounced,
  useStored,
} from "@receipt/ui";

const toneFor = (s: Flag["severity"]) => (s === "high" ? "danger" : s === "medium" ? "warn" : "info");

export function BillCheck() {
  const [text, setText] = useStored("bill_text", SAMPLE_BILL);
  const [zip, setZip] = useStored("zip", "");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [zipMap, setZipMap] = useState<Record<string, string> | null>(null);

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

  const debounced = useDebounced(text, 250);
  const audit: Audit | null = useMemo(() => {
    const lines = parseBill(debounced);
    if (lines.length === 0) return null;
    return auditBill(lines, county);
  }, [debounced, county]);

  const serious = audit ? audit.flags.filter((f) => f.severity !== "info") : [];

  return (
    <Stack>
      <div>
        <H1>Check a hospital bill</H1>
        <Lede>
          Paste an itemised bill and every line is priced against what the procedure actually costs
          in your area. You get the lines worth disputing, what they should have cost, and the
          wording to use on the phone.
        </Lede>
      </div>

      <Split
        controls={
          <>
            <Card>
              <Stack tight>
                <Field
                  label="ZIP code"
                  hint={
                    county
                      ? `${county.name}, ${county.stateName}`
                      : zip.length >= 5
                        ? "Not recognised — national prices used"
                        : "Sets the local price index"
                  }
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
                <Field label="Itemised bill">
                  <textarea
                    className="textarea"
                    value={text}
                    spellCheck={false}
                    onChange={(e) => setText(e.target.value)}
                  />
                </Field>
                <Button wide onClick={() => setText(SAMPLE_BILL)}>
                  Load the example bill
                </Button>
                <Fine>
                  Nothing is uploaded. Parsing and pricing happen in this browser, and the text stays
                  in local storage on this device.
                </Fine>
              </Stack>
            </Card>
          </>
        }
        results={
          !audit ? (
            <Card>
              <Empty>Paste a bill to see what is worth disputing.</Empty>
            </Card>
          ) : (
            <>
              <Card raised>
                <Stack tight>
                  <Eyebrow>Verdict</Eyebrow>
                  <StatRow>
                    <Stat value={usd(audit.totalBilled)} label="Billed" />
                    <Stat value={usd(audit.totalFair)} label="Fair range, typical" />
                    <Stat
                      value={
                        <span style={{ color: audit.totalRecoverable > 0 ? "var(--danger)" : undefined }}>
                          {usd(audit.totalRecoverable)}
                        </span>
                      }
                      label="Plausibly recoverable"
                    />
                  </StatRow>
                  <Divider />
                  <Fine>
                    {audit.pricedLines} of {audit.pricedLines + audit.unknownLines} lines matched the
                    reference. Local price index {audit.index.toFixed(2)}
                    {county ? ` for ${county.name}` : " (national)"}.
                  </Fine>
                </Stack>
              </Card>

              <Card>
                <Stack tight>
                  <div className="row">
                    <H2>Worth disputing</H2>
                    <span style={{ marginLeft: "auto" }}>
                      <Badge tone={serious.length ? "danger" : "ok"}>
                        {serious.length || "none"}
                      </Badge>
                    </span>
                  </div>
                  {serious.length === 0 ? (
                    <Note tone="ok">
                      No lines priced far enough outside the fair range to be worth a call.
                    </Note>
                  ) : (
                    <Stack tight>
                      {serious.map((f, i) => (
                        <Rail key={i} tone={toneFor(f.severity)}>
                          <div className="row">
                            <strong>{f.title}</strong>
                            {f.recoverable > 0 && (
                              <span style={{ marginLeft: "auto" }} className="num">
                                {usd(f.recoverable)}
                              </span>
                            )}
                          </div>
                          <p className="fine" style={{ marginTop: 2 }}>
                            {f.detail}
                          </p>
                        </Rail>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>

              <Card flush>
                <div style={{ padding: "16px 16px 10px" }}>
                  <H2>Line by line</H2>
                </div>
                {audit.lines.map((l: AuditedLine) => (
                  <LineItem
                    key={l.line.id}
                    flagged={l.removed || l.flags.some((f) => f.severity === "high")}
                    label={
                      <>
                        <div className="row" style={{ gap: 7 }}>
                          <Num>{l.line.code}</Num>
                          <span>{l.line.description}</span>
                          {l.removed && <Badge tone="danger">Remove</Badge>}
                          {l.line.unknown && <Badge>Unpriced</Badge>}
                          {l.line.units > 1 && <Badge>×{l.line.units}</Badge>}
                        </div>
                      </>
                    }
                    amount={
                      <>
                        <div>{usd(l.line.charge)}</div>
                        {!l.line.unknown && (
                          <div className="fine">fair {usd(l.fairTypical)}</div>
                        )}
                      </>
                    }
                    sub={
                      l.overcharge > 0 ? (
                        <>
                          {usd(l.overcharge)} above the typical local price
                          {l.ratio > 1 ? ` — ${l.ratio.toFixed(1)}× fair` : ""}
                        </>
                      ) : undefined
                    }
                  />
                ))}
              </Card>
            </>
          )
        }
      />
    </Stack>
  );
}
