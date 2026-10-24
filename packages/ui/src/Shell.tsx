"use client";

import React from "react";

export interface NavItem {
  id: string;
  label: string;
  /** Renders a [NEW] badge beside the label. */
  isNew?: boolean;
}

/**
 * App chrome shared by both products.
 *
 * Replaces Billculate's `Workspace`, which drew a printer housing with a status
 * LED, a slot and a paper-feed animation. There is no printer here: the nav is
 * a plain pill row and results appear in cards as soon as they are computed.
 */
export function Shell({
  product,
  mark,
  nav,
  active,
  onNavigate,
  right,
  children,
}: {
  product: string;
  mark: string;
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              {mark}
            </span>
            <span>{product}</span>
          </div>
          <nav className="nav" role="tablist" aria-label="Sections">
            {nav.map((n) => (
              <button
                key={n.id}
                role="tab"
                type="button"
                aria-selected={n.id === active}
                className="nav-item"
                onClick={() => onNavigate(n.id)}
              >
                {n.label}
                {n.isNew && <span className="badge new">New</span>}
              </button>
            ))}
          </nav>
          {right}
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
