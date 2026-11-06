"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import { AppState, type Tab, useApp } from "@/components/AppState";
import { BillCheck } from "@/components/BillCheck";
import { PreventiveCheck } from "@/components/PreventiveCheck";
import { FinancialHelp } from "@/components/FinancialHelp";
import { RightsCheck } from "@/components/RightsCheck";

function Workspace() {
  const { tab, go, serious, reviewed, flagKey } = useApp();
  const open = serious.filter((f) => !reviewed.includes(flagKey(f))).length;

  const nav: NavItem[] = [
    { id: "bill", label: "Bill check", alert: open > 0 },
    { id: "risk", label: "Health risk" },
    { id: "help", label: "Financial help" },
    { id: "rights", label: "Rights & deadlines" },
  ];

  return (
    <Shell product="CareReceipt" mark="C" nav={nav} active={tab} onNavigate={(id) => go(id as Tab)}>
      {tab === "bill" ? (
        <BillCheck />
      ) : tab === "risk" ? (
        <PreventiveCheck />
      ) : tab === "help" ? (
        <FinancialHelp />
      ) : (
        <RightsCheck />
      )}
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
