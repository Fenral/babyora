/**
 * useTooltipSeen — sessionStorage-based «har bruker sett denne tooltip?»
 *
 * Per Emil Kowalski's Linear-eksempel: når én tooltip er åpen, hopp delay
 * + animasjon på neste tooltip i samme session — det får hele toolbaren
 * til å føles raskere uten å hoppe over første-gangs-affordance.
 *
 * API:
 *   const [seen, markSeen] = useTooltipSeen('premium-activity-lock');
 *   const delay = seen ? 0 : 600;
 */
import { useCallback, useState } from 'react';

const STORAGE_PREFIX = 'babyora:tooltip-seen:';

function readSeen(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(STORAGE_PREFIX + key) === '1';
  } catch {
    return false;
  }
}

function writeSeen(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, '1');
  } catch {
    // sessionStorage utilgjengelig (private mode / quota) — fail silent
  }
}

export function useTooltipSeen(key: string): readonly [boolean, () => void] {
  const [seen, setSeen] = useState<boolean>(() => readSeen(key));

  // R3 (2026-07-14): «reset state når prop endres» via render-justering
  // (React-dokumentert mønster) i stedet for sync setState i effect.
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setSeen(readSeen(key));
  }

  const markSeen = useCallback(() => {
    writeSeen(key);
    setSeen(true);
  }, [key]);

  return [seen, markSeen] as const;
}
