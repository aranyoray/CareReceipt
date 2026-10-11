"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { Onboarding } from "@/components/Onboarding";
import { ReceiptTab } from "@/components/ReceiptTab";
import { RiskTab } from "@/components/RiskTab";
import { BillTab } from "@/components/BillTab";

type Tab = "receipt" | "risk" | "bill";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [ack, setAck] = useState(false);
  const [tab, setTab] = useState<Tab>("receipt");

  useEffect(() => {
    try {
      setAck(window.localStorage.getItem("ack_v1") === "true");
    } catch {}
    setMounted(true);
  }, []);

  const accept = (lang: Lang) => {
    try {
      window.localStorage.setItem("lang", lang);
      window.localStorage.setItem("ack_v1", "true");
    } catch {}
    setAck(true);
  };

  if (!mounted) {
    return <main className="app-shell" />;
  }

  if (!ack) {
    return (
      <main className="app-shell">
        <Onboarding onAccept={accept} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === "receipt" ? <ReceiptTab /> : tab === "risk" ? <RiskTab /> : <BillTab />}
      </div>
      <TabBar tab={tab} onChange={setTab} />
    </main>
  );
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: string }[] = [
    { id: "receipt", label: "Receipt", icon: "🧾" },
    { id: "risk", label: "US Risk", icon: "%" },
    { id: "bill", label: "Bill", icon: "$" },
  ];
  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        display: "flex",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(10,46,51,0.92)",
        backdropFilter: "blur(8px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((it) => {
        const active = it.id === tab;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            style={{
              flex: 1,
              padding: "10px 0 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: active ? "var(--rc-orange)" : "rgba(255,255,255,0.6)",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700 }}>{it.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
