"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import {
  ActionBar,
  Button,
  IconHome,
  IconReceipt,
  IconRelief,
  IconShield,
  Segmented,
} from "@/ui";
import { AppState, useApp } from "@/components/AppState";
import { BillCheck } from "@/components/BillCheck";
import { Home } from "@/components/Home";
import { PreventiveCheck } from "@/components/PreventiveCheck";
import { useReliefUrl } from "@/lib/links";

const VIEWS = [
  { id: "findings", label: "Findings" },
  { id: "lines", label: "Line by line" },
  { id: "input", label: "The bill" },
];

function Chrome() {
  const { tab, go, view, setView, audit, serious, reviewed, flagKey } = useApp();
  const reliefUrl = useReliefUrl();
  const open = serious.filter((f) => !reviewed.includes(flagKey(f))).length;

  const nav: NavItem[] = [
    { id: "home", label: "Home", icon: <IconHome /> },
    { id: "bill", label: "Bill check", icon: <IconReceipt />, alert: open > 0 },
    { id: "preventive", label: "Preventive", icon: <IconShield />, isNew: true },
    { id: "relief", label: "Relief", icon: <IconRelief />, href: reliefUrl },
  ];

  return (
    <Shell
      product="CareReceipt"
      mark="C"
      nav={nav}
      active={tab}
      onNavigate={(id) => go(id as "home" | "bill" | "preventive")}
      greeting={
        tab === "home"
          ? {
              kicker: "Welcome back",
              name: audit ? "Your bill is priced" : "Let's check a bill",
            }
          : undefined
      }
      lifted={tab === "home"}
      narrow={tab !== "preventive"}
      header={
        tab === "bill" ? (
          <Segmented
            onBrand
            options={VIEWS}
            value={view}
            onChange={(v) => setView(v as "findings" | "lines" | "input")}
          />
        ) : undefined
      }
      action={
        tab === "bill" && view === "input" ? (
          <ActionBar>
            <Button primary wide disabled={!audit} onClick={() => setView("findings")}>
              {audit
                ? `See the findings on ${audit.lines.length} ${audit.lines.length === 1 ? "line" : "lines"}`
                : "Add a bill to price it"}
            </Button>
          </ActionBar>
        ) : undefined
      }
    >
      {tab === "home" ? <Home /> : tab === "bill" ? <BillCheck /> : <PreventiveCheck />}
    </Shell>
  );
}

export default function Page() {
  return (
    <AppState>
      <Chrome />
    </AppState>
  );
}
