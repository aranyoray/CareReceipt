"use client";

import {
  Badge,
  Button,
  Card,
  Eyebrow,
  Fine,
  Hero,
  IconChevron,
  IconFlag,
  IconPin,
  IconRelief,
  IconShield,
  Legend,
  ListRow,
  Note,
  SplitBar,
  Stack,
  Stat,
  StatRow,
  Stepper,
  usd,
} from "@/ui";
import { useReliefUrl } from "@/lib/links";
import { useApp } from "./AppState";
import { Scan } from "./Scan";

/**
 * The first screen: where the bill in hand has got to, what it looks like it
 * is worth disputing, and the one thing to do next.
 */
export function Home() {
  const { audit, serious, county, zip, go, loadSample, reviewed, flagKey } = useApp();
  const reliefUrl = useReliefUrl();

  const left = serious.filter((f) => !reviewed.includes(flagKey(f)));
  const over = audit ? Math.max(0, audit.totalBilled - audit.totalFair) : 0;
  // Pricing is the step that waits on a ZIP code; findings follow from it.
  const stage = !audit ? 0 : county ? 3 : 1;

  return (
    <Stack>
      {!audit ? (
        <Card raised>
          <Stack>
            <div>
              <Eyebrow>Your bill</Eyebrow>
              <p className="h1" style={{ marginTop: 4 }}>
                Nothing to check yet
              </p>
              <Fine>
                Photograph the itemised page or paste the text. Every line is priced against what
                the procedure actually costs where you live.
              </Fine>
            </div>
            <Scan compact />
            <Button wide onClick={loadSample}>
              Try it with an example bill
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card raised>
          <Stack>
            <Stepper steps={["Bill added", "Priced locally", "Findings ready"]} at={stage} />

            <Hero
              value={usd(audit.totalRecoverable)}
              label={`plausibly recoverable from ${usd(audit.totalBilled)} billed`}
              tone={audit.totalRecoverable > 0 ? "danger" : "ok"}
            />

            <div>
              <SplitBar fair={audit.totalFair} over={over} />
              <div style={{ marginTop: 8 }}>
                <Legend
                  items={[
                    { label: "Fair range for this care", swatch: "s1" },
                    { label: "Charged above it", swatch: "s2" },
                  ]}
                />
              </div>
            </div>

            {!county && (
              <Note tone="info">
                Prices are national until you add a ZIP code. Local rates move the benchmark by up
                to a quarter either way.
              </Note>
            )}

            <Button primary wide onClick={() => go("bill", "findings")}>
              {left.length > 0
                ? `Review ${left.length} ${left.length === 1 ? "finding" : "findings"}`
                : "Open the findings"}
            </Button>
          </Stack>
        </Card>
      )}

      {audit && (
        <Card>
          <StatRow>
            <Stat value={usd(audit.totalBilled)} label="Billed" />
            <Stat value={usd(audit.totalFair)} label="Fair, typical" />
            <Stat value={`${audit.lines.length}`} label="Lines read" />
          </StatRow>
        </Card>
      )}

      <Card flush>
        <div style={{ padding: "14px 16px 6px" }}>
          <Eyebrow>Up next</Eyebrow>
        </div>

        {audit && (
          <ListRow
            icon={<IconFlag />}
            tone={left.length ? "danger" : "ok"}
            title={left.length ? "Findings to go through" : "All findings reviewed"}
            sub={
              left.length
                ? `${left.length} of ${serious.length} still to check`
                : `${serious.length} checked`
            }
            amount={left.length ? <Badge tone="danger">{left.length}</Badge> : <IconChevron />}
            onClick={() => go("bill", "findings")}
          />
        )}

        <ListRow
          icon={<IconPin />}
          tone={county ? "ok" : "warn"}
          title={county ? `${county.name}, ${county.stateName}` : "Add your ZIP code"}
          sub={county ? `ZIP ${zip}, used to price every line` : "Sets the local price benchmark"}
          amount={<IconChevron />}
          onClick={() => go("bill", "input")}
        />

        <ListRow
          icon={<IconRelief />}
          title="See if the balance can be waived"
          sub="Charity care under your state's rules"
          amount={<IconChevron />}
          onClick={() => {
            window.location.href = reliefUrl;
          }}
        />

        <ListRow
          icon={<IconShield />}
          title="Preventive check"
          sub="What to get screened for, and what your county adds"
          amount={<IconChevron />}
          onClick={() => go("preventive")}
        />
      </Card>

      <Fine>
        Nothing is uploaded. Parsing, pricing and photo reading all happen in this browser, and the
        bill stays in local storage on this device.
      </Fine>
    </Stack>
  );
}
