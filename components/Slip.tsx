"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

/* ============================================================================
   The slip and its sleeve.

   A printed result is a white clinical slip kept in a navy clinic folder.
   Until something is printed the folder sits on the desk with only the top
   edge of the slip showing.  Print draws the slip up and out of the sleeve,
   the sleeve drops away, and the slip settles while its sections come in one
   after another.  Height goes back to auto afterwards so nothing that opens
   inside the slip later is clipped.
   ========================================================================= */

/** Space above the sleeve that the slip rises into. */
const HEADROOM = 120;
/** How much of the slip shows above the sleeve while it is tucked in. */
const PEEK = 18;
const SLEEVE_H = 210;
const RISE_MS = 820;
const SETTLE_MS = 520;
const STAGGER_MS = 95;
const SECTION_MS = 440;

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * What each screen last printed, held outside React so switching tabs and
 * coming back shows the slip already out rather than the empty folder.
 */
const printed = new Map<string, unknown>();
const pulled = new Set<string>();

export function usePrinted<T>(stage: string): [T | null, (v: T | null) => void] {
  const [value, setValue] = useState<T | null>(() => (printed.get(stage) as T | undefined) ?? null);
  const set = (v: T | null) => {
    if (v === null) printed.delete(stage);
    else printed.set(stage, v);
    setValue(v);
  };
  return [value, set];
}

type Phase = "tucked" | "rise" | "settle" | "done";

function Sleeve({ dropping }: { dropping?: boolean }) {
  return (
    <div className={dropping ? "sleeve dropping" : "sleeve"} style={{ top: HEADROOM, height: SLEEVE_H }} aria-hidden>
      <span className="sleeve-name">CareReceipt</span>
    </div>
  );
}

/**
 * The stage on the right of each screen.
 *
 * `children` is the slip's content, made of `SlipSection`s; `after` is what
 * follows under the slip once it has settled, such as the findings.
 */
export function SlipStage({
  stage,
  printKey,
  idle,
  children,
  after,
}: {
  stage: string;
  printKey: string | null;
  idle: React.ReactNode;
  children: React.ReactNode;
  after?: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const slip = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("done");
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (printKey === null) return;
    const id = `${stage}:${printKey}`;

    // Number the sections so each one comes in a beat after the last.
    const sections = slip.current?.querySelectorAll<HTMLElement>(":scope > .slip-sec");
    sections?.forEach((el, i) => el.style.setProperty("--i", String(Math.max(0, i - 1))));
    const count = sections?.length ?? 1;

    if (pulled.has(id) || reducedMotion()) {
      pulled.add(id);
      setPhase("done");
      setHeight(null);
      return;
    }
    pulled.add(id);

    if (window.matchMedia("(max-width: 899px)").matches) {
      box.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setPhase("tucked");
    setHeight(HEADROOM + SLEEVE_H);

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase("rise"));
    });
    const t1 = window.setTimeout(() => {
      setPhase("settle");
      setHeight(slip.current?.offsetHeight ?? null);
    }, RISE_MS);
    const t2 = window.setTimeout(
      () => {
        setPhase("done");
        setHeight(null);
      },
      RISE_MS + Math.max(SETTLE_MS, (count - 1) * STAGGER_MS + SECTION_MS) + 60,
    );

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [stage, printKey]);

  if (printKey === null) {
    return (
      <div className="slipdesk" ref={box}>
        <div className="slipstage idle" style={{ height: HEADROOM + SLEEVE_H }}>
          <div className="slip blank" style={{ transform: `translateY(${HEADROOM - PEEK}px)` }} />
          <Sleeve />
        </div>
        <p className="slip-hint">{idle}</p>
      </div>
    );
  }

  const moving = phase !== "done";
  const slipY = phase === "tucked" ? HEADROOM - PEEK : 0;

  return (
    <div className="slipdesk" ref={box}>
      <div
        className={`slipstage ${phase}`}
        style={
          moving
            ? ({
                height: height ?? undefined,
                ["--rise-ms" as string]: `${RISE_MS}ms`,
                ["--settle-ms" as string]: `${SETTLE_MS}ms`,
                ["--stagger-ms" as string]: `${STAGGER_MS}ms`,
                ["--section-ms" as string]: `${SECTION_MS}ms`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className="slip" ref={slip} style={moving ? { transform: `translateY(${slipY}px)` } : undefined}>
          {children}
        </div>
        {(phase === "tucked" || phase === "rise" || phase === "settle") && <Sleeve dropping={phase === "settle"} />}
      </div>
      {phase === "done" && after && <div className="slip-after">{after}</div>}
    </div>
  );
}

/** One block of the slip; blocks come in one after another as it settles. */
export function SlipSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`slip-sec ${className}`.trim()}>{children}</div>;
}

/** The head of a slip: what it is, and the facts it was printed from. */
export function SlipHead({ title, lines }: { title: string; lines: React.ReactNode[] }) {
  return (
    <SlipSection className="slip-head">
      <div className="slip-brand">
        <span className="brand-mark" aria-hidden="true">
          C
        </span>
        CareReceipt
      </div>
      <h2 className="slip-title">{title}</h2>
      {lines.filter(Boolean).map((l, i) => (
        <p key={i} className="slip-meta">
          {l}
        </p>
      ))}
    </SlipSection>
  );
}
