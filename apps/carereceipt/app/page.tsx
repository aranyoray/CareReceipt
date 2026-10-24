"use client";

import { useState } from "react";
import { Shell, type NavItem } from "@receipt/ui/Shell";
import { BillCheck } from "@/components/BillCheck";
import { PreventiveCheck } from "@/components/PreventiveCheck";

const NAV: NavItem[] = [
  { id: "bill", label: "Bill check" },
  { id: "preventive", label: "Preventive check", isNew: true },
];

export default function Home() {
  // Bill check is the product. Preventive check is the second thing you find.
  const [tab, setTab] = useState("bill");

  return (
    <Shell
      product="CareReceipt"
      mark="C"
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      right={
        <a className="nav-item" href="http://localhost:3001" style={{ marginLeft: 0 }}>
          ReliefReceipt →
        </a>
      }
    >
      {tab === "bill" ? <BillCheck /> : <PreventiveCheck />}
    </Shell>
  );
}
