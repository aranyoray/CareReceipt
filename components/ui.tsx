"use client";

import { useEffect, useState } from "react";

/** Dashed perforation rule inside the receipt. */
export function DashRule({ color = "#b9b3a3" }: { color?: string }) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        width: "100%",
        backgroundImage: `repeating-linear-gradient(to right, ${color} 0 3px, transparent 3px 6px)`,
      }}
    />
  );
}

/** Torn / scalloped receipt edge (decorative). */
export function PerforatedEdge({ pointUp }: { pointUp: boolean }) {
  const cream = "var(--rc-cream)";
  // A row of triangles cut into the cream paper.
  const grad = pointUp
    ? `linear-gradient(45deg, ${cream} 50%, transparent 50%), linear-gradient(-45deg, ${cream} 50%, transparent 50%)`
    : `linear-gradient(135deg, ${cream} 50%, transparent 50%), linear-gradient(-135deg, ${cream} 50%, transparent 50%)`;
  return (
    <div
      aria-hidden
      style={{
        height: 8,
        backgroundImage: grad,
        backgroundSize: "12px 12px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: pointUp ? "0 0" : "0 100%",
      }}
    />
  );
}

/** Bottom-sheet style modal. */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar fade-in"
        style={{
          width: "100%",
          maxHeight: "90%",
          overflowY: "auto",
          background: "var(--rc-teal-deep)",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** localStorage-backed state, SSR-safe. Mirrors iOS @AppStorage. */
export function useStored(key: string, initial: string): [string, (v: string) => void] {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v !== null) setValue(v);
    } catch {}
    setReady(true);
  }, [key]);

  const set = (v: string) => {
    setValue(v);
    try {
      window.localStorage.setItem(key, v);
    } catch {}
  };

  // `ready` gates first-paint hydration mismatch; callers may ignore it.
  void ready;
  return [value, set];
}
