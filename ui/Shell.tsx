"use client";

import React from "react";

export interface NavItem {
  id: string;
  label: string;
  /** A dot on the tab, for a count of things waiting to be looked at. */
  alert?: boolean;
  /** Set for a link to the other product instead of an in-app tab. */
  href?: string;
}

/**
 * The workspace: a full-width navy bar with the product name and the screens
 * as tabs, and under it the screen fills the window, inputs in a panel down
 * the left and the receipt on the right.
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
    <div className="ws">
      <header className="ws-bar">
        <span className="ws-brand">
          <span className="brand-mark" aria-hidden="true">
            {mark}
          </span>
          {product}
        </span>
        <nav className="ws-tabs" role="tablist" aria-label="Screens">
          {nav.map((n) =>
            n.href ? (
              <a key={n.id} className="ws-tab" href={n.href}>
                {n.label}
              </a>
            ) : (
              <button
                key={n.id}
                role="tab"
                type="button"
                aria-selected={n.id === active}
                className="ws-tab"
                onClick={() => onNavigate(n.id)}
              >
                {n.label}
                {n.alert && <span className="ws-dot" aria-label="Findings waiting" />}
              </button>
            ),
          )}
        </nav>
        {right && <span className="ws-right">{right}</span>}
      </header>
      <main className="ws-main">{children}</main>
    </div>
  );
}
