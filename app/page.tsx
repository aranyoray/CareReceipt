"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import { AppState, type Tab, useApp } from "@/components/AppState";
import { BillCheck } from "@/components/BillCheck";
import { PreventiveCheck } from "@/components/PreventiveCheck";
import { useReliefUrl } from "@/lib/links";

function Workspace() {
  const { tab, go, serious, reviewed, flagKey } = useApp();
  const reliefUrl = useReliefUrl();
  const open = serious.filter((f) => !reviewed.includes(flagKey(f))).length;

  const nav: NavItem[] = [
    { id: "bill", label: "Bill check", alert: open > 0 },
    { id: "preventive", label: "Preventive" },
    { id: "relief", label: "Relief", href: reliefUrl },
  ];

  return (
    <Shell product="CareReceipt" mark="C" nav={nav} active={tab} onNavigate={(id) => go(id as Tab)}>
      {tab === "bill" ? <BillCheck /> : <PreventiveCheck />}
    </Shell>
  );
}

export default function Page() {
  return (
    <AppState>
      <Workspace />
    </AppState>
  );
}
