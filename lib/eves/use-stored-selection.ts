"use client";

import { useEffect, useState } from "react";

/** Restore browser preferences before mounting consumers such as route guards. */
export function useStoredSelection<T>(key: string, fallback: T, isValid: (value: unknown) => value is T) {
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);
  // Keep the initial validation/default stable even when callers use inline functions.
  const [initial] = useState(() => ({ fallback, isValid }));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      let restored = initial.fallback;
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
        if (initial.isValid(stored)) restored = stored;
      } catch { /* Missing, invalid, or blocked storage uses the default. */ }
      setValue(restored);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, initial]);

  function select(next: T) {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { /* Keep the current session usable when browser storage is blocked. */ }
  }
  return [value, select, ready] as const;
}
