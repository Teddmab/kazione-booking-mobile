import { useEffect, useState } from "react";

/**
 * Live clock for derived appointment statuses (late / in progress window).
 * Ticks while the screen is mounted so badges update without a full reload.
 */
export function useLiveNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
