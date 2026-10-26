"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import { AppState, type Tab, useApp } from "@/components/AppState";
import { BillCheck } from "@/components/BillCheck";
import { PreventiveCheck } from "@/components/PreventiveCheck";
import { FinancialHelp } from "@/components/FinancialHelp";

function Workspace() {
  const { tab, go, serious, reviewed, flagKey } = useApp();
  const open = serious.filter((f) => !reviewed.includes(flagKey(f))).length;

  const nav: NavItem[] = [
    { id: "bill", label: "Bill check", alert: open > 0 },
    { id: "risk", label: "Health risk" },
    { id: "help", label: "Financial help" },
  ];

  return (
    <Shell product="CareReceipt" mark="C" nav={nav} active={tab} onNavigate={(id) => go(id as Tab)}>
      {tab === "bill" ? <BillCheck /> : tab === "risk" ? <PreventiveCheck /> : <FinancialHelp />}
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
