"use client";

import type { CareModule } from "@/lib/types";
import { type Lang, tr } from "@/lib/i18n";
import { S } from "@/lib/strings";
import { Sheet } from "./ui";

const APP_VERSION = "0.1.0";

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        position: "sticky",
        top: 0,
        background: "var(--rc-teal-deep)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
      <button onClick={onClose} style={{ fontSize: 14, fontWeight: 700, color: "var(--rc-orange)" }}>
        Done
      </button>
    </div>
  );
}

export function ReferralSheet({
  open,
  onClose,
  module,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  module: CareModule;
  lang: Lang;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title={tr(S.referralTitle, lang)} onClose={onClose} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
            padding: 12,
            lineHeight: 1.5,
          }}
        >
          {tr(S.referralDisclaimer, lang)}
        </div>
        {module.referrals.map((p, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>{tr(p.name, lang)}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.45 }}>
              {tr(p.role, lang)}
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: "var(--rc-orange)" }}>
                {tr(S.accessLabel, lang)}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>
                {tr(p.access, lang)}
              </div>
            </div>
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--rc-orange)", textDecoration: "none" }}
              >
                {tr(S.visitSite, lang)} ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

const ABOUT_SECTIONS: { title: string; body: string }[] = [
  {
    title: "What this is",
    body: "CareReceipt turns invisible, population-level health risk into one affordable next step. It prints a Care Receipt: what delayed prevention can cost a community — then a short list of low- or no-cost actions.",
  },
  {
    title: "What this is not",
    body: "Not a diagnosis. Not a personal bill. Not an insurance quote. Not medical advice. The numbers describe illustrative populations, not you. Take any concern to a licensed clinician.",
  },
  {
    title: "Privacy",
    body: "No account. No advertising. No tracking. Everything is computed on this device. Nothing is shared with any school, employer, or insurer.",
  },
  {
    title: "Data status",
    body: "Care Receipt modules (Frisco, Houston, India) use illustrative placeholder figures that must be replaced with validated local data before any public use; conditions may overlap and totals are demo sums over a matched annual horizon. The US Risk tab is different: its prevalence is computed from CDC NHIS Sample Adult public-use microdata (2023–2024) — real survey estimates, though not official CDC-published joint tables, and still never a diagnosis.",
  },
  {
    title: "The mission",
    body: "A youth-led, bilingual, privacy-first bridge from invisible risk to affordable prevention — Frisco cardiometabolic first, adapted with local partners for India.",
  },
];

export function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="About CareReceipt" onClose={onClose} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        {ABOUT_SECTIONS.map((s) => (
          <div key={s.title} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--rc-orange)" }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>{s.body}</div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
          v{APP_VERSION} · Illustrative prototype
        </div>
      </div>
    </Sheet>
  );
}
