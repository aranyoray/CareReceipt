"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type Audit,
  type County,
  type Flag,
  type Geo,
  SAMPLE_BILL,
  auditBill,
  countyForZip,
  loadGeo,
  loadZipMap,
  parseBill,
} from "@receipt/core";
import { useDebounced, useStored, useStoredList } from "@receipt/ui";
import { readBillImage } from "@/lib/ocr";

export type Tab = "home" | "bill" | "preventive";
export type BillView = "findings" | "lines" | "input";

export interface ScanState {
  busy: boolean;
  pct: number;
  label: string;
  error: string;
  /** Lines the last scan added to the bill. */
  added: number;
}

interface AppValue {
  tab: Tab;
  go: (tab: Tab, view?: BillView) => void;
  view: BillView;
  setView: (v: BillView) => void;

  text: string;
  setText: (v: string) => void;
  zip: string;
  setZip: (v: string) => void;
  county: County | null;
  geoReady: boolean;

  audit: Audit | null;
  serious: Flag[];
  flagKey: (f: Flag) => string;
  reviewed: string[];
  toggleReviewed: (key: string) => void;
  clearReviewed: () => void;

  scan: ScanState;
  scanFile: (file: File) => Promise<void>;
  loadSample: () => void;
}

const Ctx = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp called outside the provider");
  return v;
}

/**
 * One place for the state both the home screen and the bill screen read: the
 * bill text, where the person is, the audit computed from the two, and which
 * findings they have already been through.
 */
export function AppState({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("home");
  const [view, setView] = useState<BillView>("findings");

  const [text, setText] = useStored("bill_text", "");
  const [zip, setZip] = useStored("zip", "");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [zipMap, setZipMap] = useState<Record<string, string> | null>(null);
  const [reviewed, setReviewed] = useStoredList("bill_reviewed");

  const [scan, setScan] = useState<ScanState>({ busy: false, pct: 0, label: "", error: "", added: 0 });

  useEffect(() => {
    Promise.all([loadGeo(), loadZipMap()]).then(([g, z]) => {
      setGeo(g);
      setZipMap(z);
    });
  }, []);

  const county = useMemo(() => {
    if (!geo || !zipMap || zip.length < 5) return null;
    return countyForZip(geo, zipMap, zip);
  }, [geo, zipMap, zip]);

  const debounced = useDebounced(text, 250);
  const audit = useMemo(() => {
    const lines = parseBill(debounced);
    if (lines.length === 0) return null;
    return auditBill(lines, county);
  }, [debounced, county]);

  const serious = useMemo(() => (audit ? audit.flags.filter((f) => f.severity !== "info") : []), [audit]);

  const flagKey = useCallback((f: Flag) => `${f.kind}:${f.lineIds.join("+")}`, []);

  const toggleReviewed = useCallback(
    (key: string) => {
      setReviewed(reviewed.includes(key) ? reviewed.filter((k) => k !== key) : [...reviewed, key]);
    },
    [reviewed, setReviewed],
  );

  const clearReviewed = useCallback(() => setReviewed([]), [setReviewed]);

  const go = useCallback((next: Tab, nextView?: BillView) => {
    setTab(next);
    if (nextView) setView(nextView);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const loadSample = useCallback(() => {
    setText(SAMPLE_BILL);
    setReviewed([]);
  }, [setText, setReviewed]);

  const scanFile = useCallback(
    async (file: File) => {
      setScan({ busy: true, pct: 0.02, label: "Preparing the photo", error: "", added: 0 });
      try {
        const found = await readBillImage(file, (p) =>
          setScan((s) => ({ ...s, pct: p.pct, label: p.label })),
        );
        const lines = parseBill(found);

        if (found.trim().length === 0) {
          setScan({
            busy: false,
            pct: 1,
            label: "",
            added: 0,
            error:
              "Nothing readable came out of that photo. A flat, well-lit shot of the itemised page, with the code and charge columns both in frame, reads best.",
          });
          return;
        }

        // Append rather than replace: an itemised bill usually runs to more
        // than one page, and each page is photographed separately. Text that
        // parsed to no billable lines is still added, because correcting a
        // misread code in the box below is far less work than typing the page
        // out again.
        setText(text.trim() ? `${text.trim()}\n${found}` : found);
        setReviewed([]);
        setScan({
          busy: false,
          pct: 1,
          label: "",
          added: lines.length,
          error:
            lines.length === 0
              ? "The text came through but no line carried both a code and a charge. It is in the box below to correct."
              : "",
        });
      } catch {
        setScan({
          busy: false,
          pct: 0,
          label: "",
          added: 0,
          error: "The reader could not start. It needs a one-off download on the first scan, so check the connection and try again.",
        });
      }
    },
    [text, setText, setReviewed],
  );

  const value: AppValue = {
    tab,
    go,
    view,
    setView,
    text,
    setText,
    zip,
    setZip,
    county,
    geoReady: geo !== null,
    audit,
    serious,
    flagKey,
    reviewed,
    toggleReviewed,
    clearReviewed,
    scan,
    scanFile,
    loadSample,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
