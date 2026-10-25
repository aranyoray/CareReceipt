"use client";

import { useEffect, useState } from "react";

/**
 * Where the sister product lives.
 *
 * In development the two apps run on neighbouring ports, in production on
 * sibling hosts. The port is only knowable in the browser, so the published
 * address is what renders on the server and the local one is swapped in after
 * mount: deriving it during render would make the server and client markup
 * disagree.
 */
export const RELIEF_URL = process.env.NEXT_PUBLIC_RELIEF_URL ?? "https://relief.carereceipt.app";

export function useReliefUrl(): string {
  const [url, setUrl] = useState(RELIEF_URL);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RELIEF_URL) return;
    if (window.location.port === "3000") {
      setUrl(`${window.location.protocol}//${window.location.hostname}:3001`);
    }
  }, []);
  return url;
}
