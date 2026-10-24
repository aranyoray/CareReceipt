"use client";

import { Shell, type NavItem } from "@receipt/ui/Shell";
import { Relief } from "@/components/Relief";

const NAV: NavItem[] = [{ id: "relief", label: "Assistance" }];

export default function Home() {
  return (
    <Shell
      product="ReliefReceipt"
      mark="R"
      nav={NAV}
      active="relief"
      onNavigate={() => {}}
      right={
        <a className="nav-item" href="http://localhost:3000">
          ← CareReceipt
        </a>
      }
    >
      <Relief />
    </Shell>
  );
}
