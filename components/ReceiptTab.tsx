"use client";

import { useState } from "react";
import { MODULES } from "@/lib/modules";
import { type Lang, LANG_SHORT } from "@/lib/i18n";
import { useStored } from "./ui";
import { ReceiptCard } from "./ReceiptCard";
import { AboutSheet, ReferralSheet } from "./Sheets";

export function ReceiptTab() {
  const [storedLang, setStoredLang] = useStored("lang", "en");
  const [moduleId, setModuleId] = useStored("module", "frisco");
  const [showAbout, setShowAbout] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  const moduleIndex = Math.max(
    0,
    MODULES.findIndex((m) => m.id === moduleId),
  );
  const module = MODULES[moduleIndex] ?? MODULES[0];

  const preferred = (storedLang as Lang) || "en";
  const lang: Lang = module.languages.includes(preferred) ? preferred : module.languages[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Top bar */}
      <div style={{ padding: "12px 16px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#fff" }}>CareReceipt</div>
          <div style={{ flex: 1 }} />
          <button
            aria-label="About and privacy"
            onClick={() => setShowAbout(true)}
            style={{ fontSize: 20, color: "rgba(255,255,255,0.9)" }}
          >
            ⓘ
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Segmented
            options={MODULES.map((m) => ({ id: m.id, label: m.tab }))}
            value={module.id}
            onChange={(id) => setModuleId(id)}
            grow
          />
          <Segmented
            options={module.languages.map((l) => ({ id: l, label: LANG_SHORT[l] }))}
            value={lang}
            onChange={(id) => {
              if (module.languages.includes(id as Lang)) setStoredLang(id);
            }}
            width={module.languages.length * 52}
          />
        </div>
      </div>

      {/* Receipt */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 16px 96px" }}>
        <div key={`${module.id}-${lang}`} className="fade-in">
          <ReceiptCard
            module={module}
            lang={lang}
            onFindCare={module.referrals.length ? () => setShowReferral(true) : undefined}
          />
        </div>
      </div>

      <AboutSheet open={showAbout} onClose={() => setShowAbout(false)} />
      <ReferralSheet
        open={showReferral}
        onClose={() => setShowReferral(false)}
        module={module}
        lang={lang}
      />
    </div>
  );
}

export function Segmented({
  options,
  value,
  onChange,
  grow,
  width,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  grow?: boolean;
  width?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: "rgba(255,255,255,0.12)",
        borderRadius: 9,
        padding: 2,
        flex: grow ? 1 : undefined,
        width: width,
      }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 8px",
              borderRadius: 7,
              color: active ? "#fff" : "rgba(255,255,255,0.7)",
              background: active ? "rgba(255,255,255,0.22)" : "transparent",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
