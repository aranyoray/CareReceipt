"use client";

import type { CSSProperties } from "react";
import type { CareModule, RiskItem } from "@/lib/types";
import { itemAmount, exposureTotal } from "@/lib/types";
import { type Lang, tr, fmtCurrency } from "@/lib/i18n";
import { S } from "@/lib/strings";
import { DashRule, PerforatedEdge } from "./ui";

const ink = "var(--rc-ink)";
const inkSoft = "var(--rc-ink-soft)";
const orange = "var(--rc-orange)";
const blue = "var(--rc-blue)";

function m(size: number, weight = 400): CSSProperties {
  return { fontSize: size, fontWeight: weight, lineHeight: 1.25 };
}

function qtyText(item: RiskItem, lang: Lang): string {
  const v = item.incidencePer100;
  const num = v === Math.round(v) ? String(Math.round(v)) : v.toFixed(1);
  return `${num} ${tr(S.inWord, lang)} 100`;
}

export function ReceiptCard({
  module,
  lang,
  onFindCare,
}: {
  module: CareModule;
  lang: Lang;
  onFindCare?: () => void;
}) {
  const detailed = module.style === "detailed";
  const signal = module.signal;

  return (
    <div style={{ filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.35))" }}>
      <PerforatedEdge pointUp />
      <div style={{ background: "var(--rc-cream)", color: ink, padding: "18px 22px" }}>
        {/* Header */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🧾</span>
            <div style={{ ...m(26, 800), letterSpacing: 1 }}>{tr(S.title, lang)}</div>
          </div>
          <div style={{ background: orange, height: 3, marginTop: 6 }} />
          <div style={{ ...m(12, 600), marginTop: 4 }}>{tr(S.tagline, lang)}</div>
          <div
            style={{
              position: "absolute",
              top: 6,
              right: -4,
              transform: "rotate(-9deg)",
              border: "2px solid var(--rc-stamp-red)",
              color: "var(--rc-stamp-red)",
              borderRadius: 4,
              padding: "3px 6px",
              ...m(9, 800),
            }}
          >
            {tr(S.demoStamp, lang)}
          </div>
        </div>

        {/* Profile */}
        <div style={{ marginTop: 14 }}>
          <div style={m(13, 700)}>{tr(module.profileTitle, lang)}</div>
          {module.profileLines.map((line, i) => (
            <div key={i} style={{ ...m(11), color: inkSoft, marginTop: 2 }}>
              {tr(line, lang)}
            </div>
          ))}
        </div>

        <div style={{ margin: "14px 0" }}>
          <DashRule />
        </div>

        {signal ? (
          <SignalBlock module={module} lang={lang} />
        ) : (
          <>
            <ItemTable module={module} lang={lang} detailed={detailed} />
            <div style={{ margin: "14px 0" }}>
              <DashRule />
            </div>
            <ExposureBlock module={module} lang={lang} />
          </>
        )}

        {/* Prevention receipt */}
        <div style={{ marginTop: 16 }}>
          <PreventionReceipt module={module} lang={lang} />
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16 }}>
          <Footer module={module} lang={lang} onFindCare={onFindCare} />
        </div>
      </div>
      <PerforatedEdge pointUp={false} />
    </div>
  );
}

function ItemTable({
  module,
  lang,
  detailed,
}: {
  module: CareModule;
  lang: Lang;
  detailed: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", ...m(11, 700) }}>
        <div style={{ flex: 1 }}>{tr(S.colItem, lang)}</div>
        <div style={{ width: detailed ? 78 : 84, textAlign: "right" }}>{tr(S.colQty, lang)}</div>
        {detailed && <div style={{ width: 66, textAlign: "right" }}>{tr(S.colCare, lang)}</div>}
        <div style={{ width: 78, textAlign: "right" }}>{tr(S.colAmt, lang)}</div>
      </div>
      {module.items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingRight: 4 }}>
            <div style={m(12)}>{tr(item.name, lang)}</div>
            {item.source && (
              <div style={{ ...m(8), color: inkSoft, marginTop: 1 }}>{tr(item.source, lang)}</div>
            )}
          </div>
          <div style={{ width: detailed ? 78 : 84, textAlign: "right", ...m(11), color: orange }}>
            {qtyText(item, lang)}
          </div>
          {detailed && (
            <div style={{ width: 66, textAlign: "right", ...m(11), color: blue }}>
              {fmtCurrency(module.currency, item.avgCareValue)}
            </div>
          )}
          <div style={{ width: 78, textAlign: "right", ...m(12, 600) }}>
            {fmtCurrency(module.currency, itemAmount(item))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExposureBlock({ module, lang }: { module: CareModule; lang: Lang }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={m(14, 800)}>{module.exposureLabel ? tr(module.exposureLabel, lang) : ""}</div>
        <div style={m(20, 800)}>{fmtCurrency(module.currency, exposureTotal(module))}</div>
      </div>
      {module.exposureCaption && (
        <div style={{ ...m(10), color: inkSoft, marginTop: 4 }}>{tr(module.exposureCaption, lang)}</div>
      )}
      {module.dataNote && (
        <div style={{ ...m(8), color: inkSoft, marginTop: 6 }}>{tr(module.dataNote, lang)}</div>
      )}
    </div>
  );
}

function SignalBlock({ module, lang }: { module: CareModule; lang: Lang }) {
  const sig = module.signal!;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ ...m(11, 800), color: orange }}>{tr(S.todaysSignal, lang)}</div>
        <div style={{ ...m(13, 600), marginTop: 3 }}>{tr(sig.signal, lang)}</div>
      </div>
      <div>
        <div style={{ ...m(11, 800), color: orange }}>{tr(S.whyItMatters, lang)}</div>
        <div style={{ ...m(11), color: inkSoft, marginTop: 3 }}>{tr(sig.whyItMatters, lang)}</div>
      </div>
      <div>
        <div style={m(11, 800)}>{tr(sig.contextTitle, lang)}</div>
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          {sig.contextRows.map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", ...m(11) }}>
              <span style={{ color: inkSoft, paddingRight: 8 }}>{tr(row.label, lang)}</span>
              <span style={{ fontWeight: 700, color: orange }}>{tr(row.value, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreventionReceipt({ module, lang }: { module: CareModule; lang: Lang }) {
  return (
    <div
      style={{
        background: "var(--rc-mint)",
        border: "1px dashed var(--rc-mint-border)",
        borderRadius: 8,
        padding: 14,
        color: "var(--rc-mint-ink)",
      }}
    >
      <div style={{ ...m(12, 800), textAlign: "center", letterSpacing: 1 }}>
        {tr(S.preventionTitle, lang)}
      </div>
      <div style={{ margin: "10px 0" }}>
        <DashRule color="rgba(26,82,48,0.4)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {module.prevention.map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", ...m(11) }}>
            <span>{tr(p.label, lang)}</span>
            <span style={{ fontWeight: 700 }}>{p.cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QRGlyph() {
  // Decorative QR-like block (the iOS app renders a scannable code here).
  const cells = 7;
  const rng = [
    1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1,
    0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1,
  ];
  return (
    <div
      aria-hidden
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cells}, 1fr)`,
        width: 54,
        height: 54,
        gap: 1,
        background: "var(--rc-cream)",
      }}
    >
      {Array.from({ length: cells * cells }).map((_, i) => (
        <div key={i} style={{ background: rng[i % rng.length] ? ink : "transparent" }} />
      ))}
    </div>
  );
}

function Footer({
  module,
  lang,
  onFindCare,
}: {
  module: CareModule;
  lang: Lang;
  onFindCare?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ ...m(11, 800), color: orange }}>{tr(S.payToday, lang)}</div>
        <div style={{ ...m(11, 800), marginTop: 2 }}>{tr(S.nextStep, lang)}</div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <QRGlyph />
        <div style={{ ...m(10), color: inkSoft }}>{tr(S.exploreCta, lang)}</div>
      </div>

      {module.referrals.length > 0 && onFindCare && (
        <button
          onClick={onFindCare}
          style={{
            ...m(13, 700),
            color: "#fff",
            background: orange,
            borderRadius: 8,
            padding: "12px 14px",
            textAlign: "center",
          }}
        >
          {tr(S.findCareCta, lang)}
        </button>
      )}

      <div style={{ margin: "2px 0" }}>
        <DashRule />
      </div>

      <div>
        <div style={{ ...m(10, 800) }}>{tr(S.privacyTitle, lang)}</div>
        <div style={{ ...m(9), color: inkSoft, marginTop: 2 }}>{tr(S.privacyBody, lang)}</div>
      </div>

      <div style={{ ...m(10, 600), textAlign: "center" }}>{tr(S.takeToClinician, lang)}</div>

      <div style={{ ...m(8), color: inkSoft }}>{tr(module.footnote, lang)}</div>
    </div>
  );
}
